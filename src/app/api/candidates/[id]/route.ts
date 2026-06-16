import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSessionUser } from '@/lib/auth-helpers';
import crypto from 'crypto';

async function dispatchWebhook(candidateId: string, payload: any) {
  const webhookUrl = process.env.NEXT_PUBLIC_WEBHOOK_RECEIVER_URL || 'http://localhost:3000/api/webhooks';
  const secret = process.env.WEBHOOK_SECRET || 'super-secret-webhook-key-for-hmac-signatures';
  
  const bodyString = JSON.stringify(payload);
  const signature = crypto
    .createHmac('sha256', secret)
    .update(bodyString)
    .digest('hex');

  let responseStatus = 0;
  let responseBody = '';
  let success = false;

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Recruiting-Signature': signature,
      },
      body: bodyString,
    });
    responseStatus = res.status;
    responseBody = await res.text();
    success = res.ok;
  } catch (err: any) {
    responseStatus = 500;
    responseBody = err.message || 'Network error';
    success = false;
  }

  // Save to audit_webhooks table using admin client
  await supabaseAdmin.from('audit_webhooks').insert({
    candidate_id: candidateId,
    event_type: payload.event,
    payload,
    target_url: webhookUrl,
    response_status: responseStatus,
    response_body: responseBody,
    success,
    retry_count: 0
  });
}

// GET: Retrieve a single candidate with their audit logs and webhooks logs
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const user = getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;

  try {
    const { data: candidate, error: candidateError } = await supabaseAdmin
      .from('candidates')
      .select('*')
      .eq('id', id)
      .single();

    if (candidateError) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    // Load audit logs
    const { data: auditLogs } = await supabaseAdmin
      .from('audit_logs')
      .select('*')
      .eq('candidate_id', id)
      .order('created_at', { ascending: false });

    // Load webhook logs
    const { data: webhookLogs } = await supabaseAdmin
      .from('audit_webhooks')
      .select('*')
      .eq('candidate_id', id)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      ...candidate,
      auditLogs: auditLogs || [],
      webhookLogs: webhookLogs || []
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

// PUT: Update a candidate (Admin/Recruiter only)
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const user = getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (user.role === 'Viewer') {
    return NextResponse.json({ error: 'Forbidden: Viewers cannot edit candidates' }, { status: 403 });
  }

  const { id } = params;

  try {
    const body = await request.json();
    const { name, email, phone, linkedin, resume_url, status, notes } = body;

    // Fetch existing candidate to calculate diff
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from('candidates')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    // Validation
    if (name !== undefined && name.trim() === '') {
      return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 });
    }
    if (email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }
    const validStatuses = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'];
    if (status !== undefined && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid candidate status' }, { status: 400 });
    }

    // Prepare update payload
    const updatePayload: any = {};
    if (name !== undefined) updatePayload.name = name.trim();
    if (email !== undefined) updatePayload.email = email.trim();
    if (phone !== undefined) updatePayload.phone = phone ? phone.trim() : null;
    if (linkedin !== undefined) updatePayload.linkedin = linkedin ? linkedin.trim() : null;
    if (resume_url !== undefined) updatePayload.resume_url = resume_url ? resume_url.trim() : null;
    if (status !== undefined) updatePayload.status = status;
    if (notes !== undefined) updatePayload.notes = notes ? notes.trim() : null;
    updatePayload.updated_at = new Date().toISOString();

    // Check what changed
    const changedFields: any = {};
    for (const key in updatePayload) {
      if (key !== 'updated_at' && updatePayload[key] !== existing[key]) {
        changedFields[key] = {
          from: existing[key],
          to: updatePayload[key]
        };
      }
    }

    // If no changes, return candidate
    if (Object.keys(changedFields).length === 0) {
      return NextResponse.json(existing);
    }

    // Apply Update
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('candidates')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Write Audit Log
    await supabaseAdmin.from('audit_logs').insert({
      candidate_id: id,
      actor_id: user.id,
      actor_role: user.role,
      action: 'UPDATE',
      changed_fields: changedFields
    });

    // Check if status changed to 'Interview' to trigger Webhook
    if (changedFields.status && changedFields.status.to === 'Interview') {
      await dispatchWebhook(id, {
        event: 'candidate.status_changed',
        candidate: {
          id,
          name: updated.name,
          email: updated.email,
          status: 'Interview',
          previous_status: changedFields.status.from
        },
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

// DELETE: Delete candidate (Admin only)
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const user = getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (user.role !== 'Admin') {
    return NextResponse.json({ error: 'Forbidden: Only Admins can delete candidates' }, { status: 403 });
  }

  const { id } = params;

  try {
    // Delete Candidate
    const { data, error } = await supabaseAdmin
      .from('candidates')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Candidate not found or deletion failed' }, { status: 404 });
    }

    // Note: Logging deletion. In a cascade delete database, we write to audit log.
    // However, since public.audit_logs references candidates(id) ON DELETE CASCADE,
    // the log would normally delete, but we can write a general system action log or rely on trigger.
    // For simplicity, cascade deletes references, so audit_logs for that candidate are cleaned up.

    return NextResponse.json({ message: 'Candidate deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
