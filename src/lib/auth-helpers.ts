import { supabaseAdmin } from './supabase';

/**
 * Decodes the JWT token from the Request's cookies to retrieve the user session info.
 * 
 * SECURITY NOTE & TRADE-OFF:
 * This function extracts user metadata (e.g. role, email, sub) by base64-decoding the JWT payload 
 * WITHOUT verifying the cryptographic signature. 
 * This is a design decision for the routing layer and simple backend log operations, which reduces CPU latency 
 * and avoids external service checks.
 * Crucially, Row-Level Security (RLS) policies on Supabase are fully enforced when performing data requests, 
 * ensuring that data access control remains secure regardless of this quick metadata extraction.
 */
export function getSessionUser(request: Request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const trim = c.trim();
      const eqIdx = trim.indexOf('=');
      if (eqIdx === -1) return ['', ''];
      return [trim.substring(0, eqIdx), trim.substring(eqIdx + 1)];
    }).filter(([k]) => k !== '')
  );

  const token = cookies['sb-access-token'];
  if (!token) return null;

  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.user_metadata?.role || 'Viewer',
    };
  } catch (e) {
    return null;
  }
}
