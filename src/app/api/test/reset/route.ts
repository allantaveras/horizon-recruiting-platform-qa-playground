import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  // Ensure we only allow this in test or development environments
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Not allowed in production environment' },
      { status: 403 }
    );
  }

  try {
    const { error } = await supabaseAdmin.rpc('reset_test_database');

    if (error) {
      console.error('Database reset failed detailed:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Clear received webhooks file
    const filePath = path.join(process.cwd(), 'received_webhooks.json');
    fs.writeFileSync(filePath, JSON.stringify([], null, 2), 'utf8');

    return NextResponse.json({ message: 'Database reset successfully' }, { status: 200 });
  } catch (err: any) {
    console.error('Unexpected error during database reset:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
