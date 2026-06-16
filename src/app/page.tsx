'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Lock, Mail, Users, ArrowRight, AlertTriangle, CheckCircle, RotateCcw } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetStatus, setResetStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Clear cookie and localStorage when mounting login page to start fresh session
  useEffect(() => {
    document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=' + window.location.hostname + '; SameSite=Lax';
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
          localStorage.removeItem(key);
        }
      }
    } catch (e) {
      // Intentionally swallowed: localStorage cleanup errors are non-critical
    }
    try {
      supabase.auth.signOut();
    } catch (e) {
      // Intentionally swallowed: signOut failure is non-critical during cleanup
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        throw new Error(signInError.message);
      }

      if (data?.session) {
        document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=${data.session.expires_in}`;
        router.push('/dashboard');
      } else {
        throw new Error('No session returned');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
      setLoading(false);
    }
  };

  const handleQuickLogin = async (role: 'Admin' | 'Recruiter' | 'Viewer') => {
    setLoading(true);
    setError(null);
    
    let targetEmail = '';
    if (role === 'Admin') targetEmail = 'admin@recruiting.local';
    else if (role === 'Recruiter') targetEmail = 'recruiter@recruiting.local';
    else targetEmail = 'viewer@recruiting.local';

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: 'password123',
      });

      if (signInError) throw signInError;

      if (data?.session) {
        document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=${data.session.expires_in}`;
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || `Quick login failed for ${role}`);
      setLoading(false);
    }
  };

  const handleResetDb = async () => {
    try {
      setLoading(true);
      setError(null);
      setResetStatus('idle');
      const res = await fetch('/api/test/reset', { method: 'POST' });
      if (res.ok) {
        setResetStatus('success');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to reset database');
        setResetStatus('error');
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to reset API');
      setResetStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex flex-col justify-center items-center px-4 relative">
      {/* Visual Header Branding */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4 shadow-lg shadow-indigo-500/20">
          <Users className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          Horizon Portal
        </h1>
        <p className="text-sm text-textMuted mt-2">
          Internal Recruiting Operations Platform
        </p>
      </div>

      <div className="w-full max-w-md glass-card p-8 relative overflow-hidden">
        {/* Border glow effect */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
        
        <h2 className="text-xl font-bold text-textLight mb-6">Log in to your account</h2>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-950/40 border border-red-500/30 flex items-start space-x-3 text-red-200 text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {resetStatus === 'success' && (
          <div className="mb-6 p-4 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex items-start space-x-3 text-emerald-200 text-sm">
            <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-500" />
            <span>Database reset and seeded successfully!</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 w-5 h-5 text-textMuted" />
              <input
                id="email-input"
                type="email"
                required
                className="w-full glass-input pl-11"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-5 h-5 text-textMuted" />
              <input
                id="password-input"
                type="password"
                required
                className="w-full glass-input pl-11"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            id="login-btn"
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium flex items-center justify-center space-x-2 transition-all duration-200 shadow-md shadow-indigo-600/10 hover:shadow-indigo-500/20 disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="relative flex py-5 items-center">
          <div className="flex-grow border-t border-white/5"></div>
          <span className="flex-shrink mx-4 text-textMuted text-xs uppercase tracking-widest">Demo Access</span>
          <div className="flex-grow border-t border-white/5"></div>
        </div>

        {/* Quick select buttons */}
        <div className="space-y-3">
          <button
            id="quick-admin"
            onClick={() => handleQuickLogin('Admin')}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-white/10 text-xs font-semibold text-textLight flex items-center justify-between transition-colors duration-150"
            aria-label="Quick login as Administrator"
          >
            <span>Login as Administrator</span>
            <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] uppercase">Admin</span>
          </button>
          
          <button
            id="quick-recruiter"
            onClick={() => handleQuickLogin('Recruiter')}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-white/10 text-xs font-semibold text-textLight flex items-center justify-between transition-colors duration-150"
            aria-label="Quick login as Recruiter"
          >
            <span>Login as Recruiter</span>
            <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] uppercase">Recruiter</span>
          </button>
          
          <button
            id="quick-viewer"
            onClick={() => handleQuickLogin('Viewer')}
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg bg-white/[0.02] hover:bg-white/[0.06] border border-white/10 text-xs font-semibold text-textLight flex items-center justify-between transition-colors duration-150"
            aria-label="Quick login as Guest Viewer"
          >
            <span>Login as Guest Viewer</span>
            <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 text-[10px] uppercase">Viewer</span>
          </button>

          <div className="pt-2">
            <button
              id="reset-db-btn"
              type="button"
              onClick={handleResetDb}
              disabled={loading}
              className="w-full py-2 px-4 rounded-lg bg-white/[0.01] hover:bg-white/[0.04] border border-white/5 text-[10px] font-medium text-textMuted flex items-center justify-center space-x-2 transition-colors duration-150"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Demo Data (Dev Only)</span>
            </button>
          </div>

          <div className="pt-4 text-center border-t border-white/5 mt-4">
            <Link
              id="candidate-apply-link"
              href="/apply"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center justify-center space-x-1.5"
            >
              <span>Are you a candidate? Submit your application here</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
