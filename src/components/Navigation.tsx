'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LayoutDashboard, Users, LogOut, Briefcase } from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; role: string } | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser({
            email: session.user.email || '',
            role: session.user.user_metadata?.role || 'Viewer'
          });
        }
      } catch (e) {
        // Intentionally swallowed: session retrieval errors are non-critical on mount
      }
    }
    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          email: session.user.email || '',
          role: session.user.user_metadata?.role || 'Viewer'
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    // Clear auth cookies on client side as a fallback
    document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=' + window.location.hostname;

    // Clear local storage session tokens
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

    // Call server endpoint to clear HttpOnly cookie
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      // Intentionally swallowed: fallback to local routing if endpoint fails
    }

    try {
      await supabase.auth.signOut();
    } catch (e) {
      // Intentionally swallowed: signOut failure is non-critical since cookies are already cleared
    }

    // Hard redirect to bypass Next.js client router caching
    window.location.href = '/';
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'Recruiter': return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      default: return 'bg-teal-500/20 text-teal-300 border-teal-500/30';
    }
  };

  return (
    <nav className="w-full border-b border-white/5 bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <div className="flex items-center space-x-3">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-textLight tracking-tight">Horizon</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-white/5 border border-white/10 text-textMuted uppercase font-semibold">HQ</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex space-x-1">
            <Link
              id="nav-dashboard"
              href="/dashboard"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === '/dashboard'
                  ? 'bg-white/5 text-textLight border border-white/10'
                  : 'text-textMuted hover:text-textLight hover:bg-white/[0.02]'
              }`}
            >
              <div className="flex items-center space-x-2">
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </div>
            </Link>

            <Link
              id="nav-candidates"
              href="/candidates"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname.startsWith('/candidates')
                  ? 'bg-white/5 text-textLight border border-white/10'
                  : 'text-textMuted hover:text-textLight hover:bg-white/[0.02]'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Candidates</span>
              </div>
            </Link>
          </div>

          {/* User Section & Logout */}
          <div className="flex items-center space-x-4">
            {user && (
              <div className="hidden sm:flex flex-col items-end mr-2 text-right">
                <span className="text-xs font-semibold text-textLight">{user.email}</span>
                <span className={`text-[10px] mt-0.5 px-2 py-0.25 rounded-full border ${getRoleBadgeColor(user.role)} font-bold uppercase`}>
                  {user.role}
                </span>
              </div>
            )}

            <button
              id="logout-btn"
              onClick={handleLogout}
              className="p-2 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-red-950/20 hover:border-red-950/30 hover:text-red-300 transition-colors text-textMuted"
              title="Sign Out"
              aria-label="Sign out of your account"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
