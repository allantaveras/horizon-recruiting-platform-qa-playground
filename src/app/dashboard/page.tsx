'use client';

import React, { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { getStatusStyle } from '@/lib/constants';
import { 
  Users, UserCheck, PhoneCall, FileText, Send, XCircle, 
  ArrowRight, ShieldCheck, Activity, Database
} from 'lucide-react';

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  created_at: string;
}

export default function Dashboard() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/candidates');
        if (!res.ok) {
          throw new Error('Failed to load dashboard statistics');
        }
        const data = await res.json();
        setCandidates(data);
      } catch (err: any) {
        setError(err.message || 'Error fetching stats');
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  // Compute stats
  const total = candidates.length;
  const countByStatus = (status: string) => candidates.filter(c => c.status === status).length;

  const applied = countByStatus('Applied');
  const screening = countByStatus('Screening');
  const interview = countByStatus('Interview');
  const offer = countByStatus('Offer');
  const hired = countByStatus('Hired');
  const rejected = countByStatus('Rejected');

  const inPipeline = applied + screening + interview + offer;
  const offerToHireRate = offer + hired > 0 ? Math.round((hired / (offer + hired)) * 100) : 0;

  // Custom status configuration
  const pipelineStages = [
    { label: 'Applied', count: applied, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', barBg: 'bg-indigo-400' },
    { label: 'Screening', count: screening, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', barBg: 'bg-blue-400' },
    { label: 'Interview', count: interview, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20', barBg: 'bg-purple-400' },
    { label: 'Offer', count: offer, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20', barBg: 'bg-pink-400' },
  ];

  return (
    <>
      <Navigation />
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-textLight tracking-tight">Hiring Operations</h1>
            <p className="text-textMuted text-sm mt-1">Real-time metrics, pipeline analytics, and audit logs.</p>
          </div>
          
          {/* Environment status indicators */}
          <div className="flex items-center space-x-3 mt-4 md:mt-0">
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs">
              <Database className="w-3.5 h-3.5 text-accentTeal" />
              <span className="text-textMuted">Database:</span>
              <span className="text-textLight font-semibold">PostgreSQL</span>
            </div>
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-accentPurple" />
              <span className="text-textMuted">RLS Mode:</span>
              <span className="text-textLight font-semibold">Active</span>
            </div>
          </div>
        </div>

        {error ? (
          <div className="p-6 rounded-xl bg-red-950/20 border border-red-500/30 text-red-200">
            <p className="font-semibold">Failed to load Dashboard data</p>
            <p className="text-sm text-red-300 mt-1">{error}</p>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 glass-card bg-white/[0.01]" />
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Top Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Card 1: Total Candidates */}
              <div className="glass-card p-6 relative overflow-hidden group hover:border-white/15 transition-colors">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-bl-full filter blur-md" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-textMuted">Total Candidates</span>
                  <div className="p-2 bg-indigo-500/15 rounded-lg">
                    <Users className="w-5 h-5 text-indigo-400" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-textLight">{total}</span>
                  <span className="text-xs block text-textMuted mt-1">Active resumes registered</span>
                </div>
              </div>

              {/* Card 2: Hired */}
              <div className="glass-card p-6 relative overflow-hidden group hover:border-white/15 transition-colors">
                <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/10 rounded-bl-full filter blur-md" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-textMuted">Total Hires</span>
                  <div className="p-2 bg-teal-500/15 rounded-lg">
                    <UserCheck className="w-5 h-5 text-accentTeal" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-textLight">{hired}</span>
                  <span className="text-xs block text-textMuted mt-1">Successful onboardings</span>
                </div>
              </div>

              {/* Card 3: In Pipeline */}
              <div className="glass-card p-6 relative overflow-hidden group hover:border-white/15 transition-colors">
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-bl-full filter blur-md" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-textMuted">Active Pipeline</span>
                  <div className="p-2 bg-purple-500/15 rounded-lg">
                    <Activity className="w-5 h-5 text-accentPurple" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-textLight">{inPipeline}</span>
                  <span className="text-xs block text-textMuted mt-1">Candidates in active stages</span>
                </div>
              </div>

              {/* Card 4: Conversion Rate */}
              <div className="glass-card p-6 relative overflow-hidden group hover:border-white/15 transition-colors">
                <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/10 rounded-bl-full filter blur-md" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-textMuted">Conversion Rate</span>
                  <div className="p-2 bg-pink-500/15 rounded-lg">
                    <Send className="w-5 h-5 text-accentPink" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-textLight">{offerToHireRate}%</span>
                  <span className="text-xs block text-textMuted mt-1">Offer acceptance probability</span>
                </div>
              </div>

            </div>

            {/* Custom Interactive Hiring Pipeline Chart */}
            <div className="glass-card p-6">
              <h2 className="text-lg font-bold text-textLight mb-6">Interactive Pipeline Stages</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {pipelineStages.map((stage) => (
                  <div key={stage.label} className={`p-4 rounded-xl border ${stage.bg} ${stage.border} flex items-center justify-between`}>
                    <div>
                      <span className="text-xs font-medium text-textMuted uppercase tracking-wider block">{stage.label}</span>
                      <span className="text-2xl font-bold text-textLight mt-1 inline-block">{stage.count}</span>
                    </div>
                    {/* Tiny custom SVG bar chart indicator */}
                    <div className="w-12 h-12 flex items-end justify-center space-x-1">
                      <div className="w-2.5 bg-white/5 rounded-t h-full" />
                      <div className={`w-2.5 ${stage.barBg} rounded-t`} style={{ height: `${total > 0 ? (stage.count / total) * 100 : 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Row Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Pipeline Status Balance */}
              <div className="glass-card p-6 lg:col-span-1">
                <h2 className="text-lg font-bold text-textLight mb-6">Resolution Metrics</h2>
                <div className="space-y-4">
                  {/* Hired progress */}
                  <div>
                    <div className="flex justify-between text-xs mb-1 font-semibold">
                      <span className="text-textMuted">Hired Resolution</span>
                      <span className="text-accentTeal">{hired} candidates</span>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                      <div className="bg-accentTeal h-full rounded-full" style={{ width: `${total > 0 ? (hired / total) * 100 : 0}%` }} />
                    </div>
                  </div>

                  {/* Rejected progress */}
                  <div>
                    <div className="flex justify-between text-xs mb-1 font-semibold">
                      <span className="text-textMuted">Rejected Resolution</span>
                      <span className="text-red-400">{rejected} candidates</span>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                      <div className="bg-red-500 h-full rounded-full" style={{ width: `${total > 0 ? (rejected / total) * 100 : 0}%` }} />
                    </div>
                  </div>

                  {/* Pending percentage info */}
                  <div className="pt-4 border-t border-white/5 mt-4">
                    <p className="text-xs text-textMuted leading-relaxed">
                      Resolutions comprise Hires and Rejections. Keeping the screening and interview queue balanced ensures short evaluation timelines.
                    </p>
                  </div>
                </div>
              </div>

              {/* Recent Active Candidates list */}
              <div className="glass-card p-6 lg:col-span-2">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-textLight">Active Candidate Roster</h2>
                  <a href="/candidates" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1">
                    <span>Manage All</span>
                    <ArrowRight className="w-3 h-3" />
                  </a>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5 text-textMuted text-xs font-semibold uppercase tracking-wider">
                        <th className="pb-3">Candidate</th>
                        <th className="pb-3">Current Status</th>
                        <th className="pb-3">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                      {candidates.slice(0, 4).map((c) => (
                        <tr key={c.id} className="group hover:bg-white/[0.01] transition-colors">
                          <td className="py-4">
                            <span className="font-semibold text-textLight">{c.name}</span>
                            <span className="text-xs text-textMuted block">{c.email}</span>
                          </td>
                          <td className="py-4">
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${getStatusStyle(c.status)}`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="py-4 text-textMuted text-xs">
                            {new Date(c.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        )}
      </main>
    </>
  );
}
