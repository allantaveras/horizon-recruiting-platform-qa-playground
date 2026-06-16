import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, linkedin, resume_url, notes } = body;

    // Validation
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    // Insert Candidate with 'Applied' status
    const { data: candidate, error: insertError } = await supabaseAdmin
      .from('candidates')
      .insert({
        name: name.trim(),
        email: email.trim(),
        phone: phone?.trim() || null,
        linkedin: linkedin?.trim() || null,
        resume_url: resume_url?.trim() || null,
        status: 'Applied',
        notes: notes?.trim() || null
      })
      .select()
      .single();

    if (insertError) {
      console.error('Candidate insert error:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Write Audit Log with Candidate actor role and null actor_id
    await supabaseAdmin.from('audit_logs').insert({
      candidate_id: candidate.id,
      actor_id: null,
      actor_role: 'Candidate',
      action: 'CREATE',
      changed_fields: {
        name: candidate.name,
        email: candidate.email,
        status: candidate.status
      }
    });

    return NextResponse.json(candidate, { status: 201 });
  } catch (err: any) {
    console.error('Unexpected error in public apply API:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
