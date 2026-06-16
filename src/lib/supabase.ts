import { createClient } from '@supabase/supabase-js';

const isServer = typeof window === 'undefined';
const isDocker = isServer && process.env.DATABASE_URL && process.env.DATABASE_URL.includes('@db:');

const supabaseUrl = isServer
  ? (isDocker ? 'http://postgrest:3000' : 'http://localhost:30000')
  : (process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:3000');

const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Custom fetch to strip "/rest/v1/" when talking directly to PostgREST on the server
const customFetch = (url: URL | RequestInfo, options?: RequestInit) => {
  const urlStr = url.toString();
  const cleanUrl = isServer && urlStr.includes('/rest/v1/')
    ? urlStr.replace('/rest/v1/', '/')
    : urlStr;
  return fetch(cleanUrl, options);
};

// Client-side / general client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    fetch: customFetch
  }
});

// Admin client (runs server-side; uses dummy key client-side to prevent module crash)
// SECURITY NOTE: The SUPABASE_SERVICE_ROLE_KEY contains sensitive server-side admin privileges.
// To prevent accidental exposure in client-side bundles, we check if we are running on the server.
// If imported/run on the client, a dummy fallback string is provided. This ensures that any accidental
// attempt to use supabaseAdmin in browser code will safely fail, and the service role key will not be leaked.
export const supabaseAdmin = createClient(
  supabaseUrl,
  isServer ? supabaseServiceKey : 'dummy-key-to-prevent-browser-crashes',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      fetch: customFetch
    }
  }
);
