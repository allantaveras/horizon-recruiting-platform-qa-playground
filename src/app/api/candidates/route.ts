import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSessionUser } from '@/lib/auth-helpers';

// GET: List, Search, and Filter candidates
export async function GET(request: Request) {
  const user = getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';

  try {
    let query = supabaseAdmin.from('candidates').select('*').order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data: candidates, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(candidates);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

// POST: Create a new candidate (Admin/Recruiter only)
export async function POST(request: Request) {
  const user = getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (user.role === 'Viewer') {
    return NextResponse.json({ error: 'Forbidden: Viewers cannot create candidates' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, email, phone, linkedin, resume_url, status = 'Applied', notes } = body;

    // Validation
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }
    const validStatuses = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid candidate status' }, { status: 400 });
    }

    // Insert Candidate
    const { data: candidate, error: insertError } = await supabaseAdmin
      .from('candidates')
      .insert({
        name: name.trim(),
        email: email.trim(),
        phone: phone?.trim() || null,
        linkedin: linkedin?.trim() || null,
        resume_url: resume_url?.trim() || null,
        status,
        notes: notes?.trim() || null
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Write Audit Log
    await supabaseAdmin.from('audit_logs').insert({
      candidate_id: candidate.id,
      actor_id: user.id,
      actor_role: user.role,
      action: 'CREATE',
      changed_fields: {
        name: candidate.name,
        email: candidate.email,
        status: candidate.status
      }
    });

    return NextResponse.json(candidate, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
