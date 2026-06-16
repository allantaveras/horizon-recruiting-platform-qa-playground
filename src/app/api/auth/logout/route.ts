import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  
  // Explicitly clear the sb-access-token cookie by returning a expired Set-Cookie header
  response.cookies.set('sb-access-token', '', {
    path: '/',
    expires: new Date(0),
    maxAge: 0,
    httpOnly: true,
    sameSite: 'lax',
  });
  
  return response;
}
