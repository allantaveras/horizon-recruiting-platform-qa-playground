'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { supabase } from '@/lib/supabase';
import { STATUS_OPTIONS, getStatusStyle, CandidateStatus } from '@/lib/constants';
import { 
  ArrowLeft, Edit3, Trash2, Calendar, Mail, Phone, Link2, 
  FileText, Activity, Save, X, AlertTriangle, Clock
} from 'lucide-react';

interface AuditLog {
  id: string;
  actor_role: string;
  action: string;
  changed_fields: any;
  created_at: string;
}

interface CandidateDetails {
  id: string;
  name: string;
  email: string;
  phone: string;
  linkedin: string;
  resume_url: string;
  status: CandidateStatus;
  notes: string;
  created_at: string;
  updated_at: string;
  auditLogs: AuditLog[];
}

// Note: params is destructured synchronously here. This works in Next.js 14 client components
// but may need to be updated to use React.use() in future Next.js versions.
export default function CandidateDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  
  const [candidate, setCandidate] = useState<CandidateDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState('Viewer');

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editLinkedin, setEditLinkedin] = useState('');
  const [editResume, setEditResume] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Delete confirmation state (replaces native confirm() dialog)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    async function loadUserRole() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUserRole(session.user.user_metadata?.role || 'Viewer');
        }
      } catch (e) {
        // Intentionally swallowed: session retrieval errors are non-critical on mount
      }
    }
    loadUserRole();

    loadCandidateDetails();
  }, [id]);

  async function loadCandidateDetails() {
    setLoading(true);
    try {
      const res = await fetch(`/api/candidates/${id}`, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error('Candidate record not found or access denied');
      }
      const data = await res.json();
      setCandidate(data);
      
      // Seed edit fields
      setEditName(data.name || '');
      setEditEmail(data.email || '');
      setEditPhone(data.phone || '');
      setEditLinkedin(data.linkedin || '');
      setEditResume(data.resume_url || '');
      setEditStatus(data.status || '');
      setEditNotes(data.notes || '');
    } catch (err: any) {
      setError(err.message || 'Error loading details');
    } finally {
      setLoading(false);
    }
  }

  const handleUpdateStatusDirect = async (newStatus: string) => {
    if (!candidate || newStatus === candidate.status) return;
    setStatusUpdating(true);
    setEditError(null);

    try {
      const res = await fetch(`/api/candidates/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update candidate status');
      }

      await loadCandidateDetails();
    } catch (err: any) {
      setEditError(err.message || 'Error updating status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);
    setEditSubmitting(true);

    if (!editName.trim()) {
      setEditError('Candidate name cannot be empty');
      setEditSubmitting(false);
      return;
    }
    if (!editEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editEmail)) {
      setEditError('A valid email address is required');
      setEditSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`/api/candidates/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          phone: editPhone,
          linkedin: editLinkedin,
          resume_url: editResume,
          status: editStatus,
          notes: editNotes,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update candidate record');
      }

      setIsEditing(false);
      loadCandidateDetails();
    } catch (err: any) {
      setEditError(err.message || 'Error saving changes');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/candidates/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Deletion failed');
      }

      window.location.href = '/candidates';
    } catch (err: any) {
      setDeleteError(err.message || 'Error deleting candidate');
      setShowDeleteConfirm(false);
    }
  };

  if (error) {
    return (
      <>
        <Navigation />
        <div className="max-w-3xl mx-auto py-16 px-4">
          <div className="glass-card p-6 border-red-500/30 bg-red-950/20 text-red-200">
            <h2 className="font-bold text-lg">Error accessing profile</h2>
            <p className="text-sm mt-1">{error}</p>
            <Link href="/candidates" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 mt-4 inline-flex items-center space-x-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to candidates directory</span>
            </Link>
          </div>
        </div>
      </>
    );
  }

  if (loading || !candidate) {
    return (
      <>
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse space-y-6">
          <div className="h-6 w-32 bg-white/5" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 h-96 bg-white/[0.01] rounded-xl" />
            <div className="lg:col-span-2 h-96 bg-white/[0.01] rounded-xl" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        
        {/* Back Link */}
        <div className="mb-6">
          <Link
            id="back-to-candidates"
            href="/candidates"
            className="inline-flex items-center space-x-1.5 text-xs text-textMuted hover:text-textLight transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to candidates list</span>
          </Link>
        </div>

        {/* Delete error banner */}
        {deleteError && (
          <div className="mb-4 p-4 rounded-lg bg-red-950/40 border border-red-500/30 flex items-start space-x-3 text-red-200 text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-500" />
            <span>{deleteError}</span>
          </div>
        )}

        {/* Delete Confirmation Overlay */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="glass-card p-8 max-w-md w-full mx-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-red-500 via-red-400 to-orange-500" />
              <h3 className="text-lg font-bold text-textLight mb-2">Delete Candidate Record</h3>
              <p className="text-sm text-textMuted mb-6">Are you sure you want to permanently delete this candidate record? This action cannot be undone and will remove all associated audit logs.</p>
              <div className="flex items-center space-x-3 justify-end">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="py-2 px-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold text-textLight transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="py-2 px-4 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-semibold text-white transition-colors"
                >
                  Yes, Delete Permanently
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Action Header bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-textLight tracking-tight">{candidate.name}</h1>
            <div className="flex items-center space-x-3 mt-1.5">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusStyle(candidate.status)}`}>
                {candidate.status}
              </span>
              <span className="text-xs text-textMuted flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Added {new Date(candidate.created_at).toLocaleDateString()}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            {userRole !== 'Viewer' && !isEditing && (
              <button
                id="edit-candidate-btn"
                onClick={() => setIsEditing(true)}
                className="flex-grow sm:flex-grow-0 py-2.5 px-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-xs font-semibold text-textLight flex items-center justify-center space-x-2 transition-all duration-150"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Candidate</span>
              </button>
            )}

            {userRole === 'Admin' && (
              <button
                id="delete-candidate-btn"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex-grow sm:flex-grow-0 py-2.5 px-4 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 hover:border-red-500/30 text-xs font-semibold text-red-300 flex items-center justify-center space-x-2 transition-all duration-150"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Record</span>
              </button>
            )}
          </div>
        </div>

        {/* Hiring Pipeline Stepper */}
        <div className="glass-card p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-sm font-bold text-textLight uppercase tracking-wider mb-1">Hiring Stage Pipeline</h2>
              <p className="text-xs text-textMuted">Click to transition the candidate through the hiring process.</p>
            </div>
            {statusUpdating && (
              <span className="text-xs text-accentIndigo animate-pulse flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5 animate-spin" />
                <span>Updating pipeline status...</span>
              </span>
            )}
          </div>

          <div className="relative">
            <div className="flex flex-wrap lg:flex-nowrap justify-between gap-3 relative z-10">
              {STATUS_OPTIONS.map((stage, idx) => {
                const isCurrent = candidate.status === stage;
                const isViewer = userRole === 'Viewer';
                const isRejected = candidate.status === 'Rejected';
                
                const currentIdx = STATUS_OPTIONS.indexOf(candidate.status);
                const isPast = idx < currentIdx && !isRejected;

                let nodeStyle = 'border-white/10 bg-white/5 text-textMuted hover:border-white/20 hover:bg-white/[0.08]';
                
                if (isCurrent) {
                  if (stage === 'Hired') {
                    nodeStyle = 'border-teal-500/40 bg-teal-500/10 text-teal-300 ring-2 ring-teal-500/20';
                  } else if (stage === 'Rejected') {
                    nodeStyle = 'border-red-500/40 bg-red-500/10 text-red-300 ring-2 ring-red-500/20';
                  } else {
                    nodeStyle = 'border-accentIndigo/40 bg-accentIndigo/10 text-indigo-300 ring-2 ring-accentIndigo/20';
                  }
                } else if (isPast && stage !== 'Rejected') {
                  nodeStyle = 'border-accentIndigo/20 bg-accentIndigo/5 text-indigo-400/80';
                }

                return (
                  <button
                    key={stage}
                    id={`pipeline-stage-${stage.toLowerCase()}`}
                    disabled={isViewer || statusUpdating || isCurrent}
                    onClick={() => handleUpdateStatusDirect(stage)}
                    data-stage={stage}
                    className={`flex-grow flex-1 py-3 px-4 rounded-xl border flex flex-col items-center justify-center transition-all duration-200 before:content-[attr(data-stage)] before:text-xs before:font-bold ${nodeStyle} ${
                      isViewer || isCurrent 
                        ? 'cursor-default hover:scale-100 hover:bg-inherit' 
                        : 'hover:scale-[1.02] active:scale-[0.98]'
                    }`}
                  >
                    <span className="text-[9px] mt-0.5 opacity-60">
                      {isCurrent ? 'Current' : isPast && stage !== 'Rejected' ? 'Completed' : 'Move to'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Grid layout cockpit */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN: Profile info / Edit Form */}
          <div className="lg:col-span-1 space-y-6">
            <div className="glass-card p-6 relative">
              <div className="absolute top-0 right-0 w-16 h-16 bg-white/[0.02] rounded-bl-full" />
              
              <h2 className="text-base font-bold text-textLight mb-6 flex items-center space-x-2">
                <span>Profile Contact Details</span>
              </h2>

              {isEditing ? (
                <form id="edit-candidate-form" onSubmit={handleUpdate} className="space-y-4">
                  {editError && (
                    <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-red-200 text-xs flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-500" />
                      <span>{editError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-[10px] font-bold text-textMuted uppercase tracking-wider mb-1">Full Name</label>
                    <input
                      id="edit-name"
                      type="text"
                      className="w-full glass-input text-sm"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-textMuted uppercase tracking-wider mb-1">Email</label>
                    <input
                      id="edit-email"
                      type="email"
                      className="w-full glass-input text-sm"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-textMuted uppercase tracking-wider mb-1">Phone</label>
                    <input
                      id="edit-phone"
                      type="text"
                      className="w-full glass-input text-sm"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-textMuted uppercase tracking-wider mb-1">LinkedIn Profile</label>
                    <input
                      id="edit-linkedin"
                      type="url"
                      className="w-full glass-input text-sm"
                      value={editLinkedin}
                      onChange={(e) => setEditLinkedin(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-textMuted uppercase tracking-wider mb-1">Resume PDF</label>
                    <input
                      id="edit-resume"
                      type="url"
                      className="w-full glass-input text-sm"
                      value={editResume}
                      onChange={(e) => setEditResume(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-textMuted uppercase tracking-wider mb-1">Hiring Pipeline Status</label>
                    <select
                      id="edit-status"
                      className="w-full glass-input bg-cardBackground text-sm"
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                    >
                      {STATUS_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-textMuted uppercase tracking-wider mb-1">Notes / Evaluation comments</label>
                    <textarea
                      id="edit-notes"
                      rows={3}
                      className="w-full glass-input text-sm"
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <button
                      id="cancel-edit-btn"
                      type="button"
                      onClick={() => { setIsEditing(false); setEditError(null); }}
                      className="flex-1 py-2 px-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold text-textLight transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      id="save-candidate-btn"
                      type="submit"
                      disabled={editSubmitting}
                      className="flex-1 py-2 px-3 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-xs font-semibold text-white flex items-center justify-center space-x-1.5 transition-all disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{editSubmitting ? 'Saving...' : 'Save'}</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-start space-x-3 text-sm">
                    <Mail className="w-4 h-4 text-textMuted mt-0.5 flex-shrink-0" />
                    <div className="flex-grow min-w-0">
                      <span className="text-[10px] font-bold text-textMuted uppercase tracking-wider block">Email Address</span>
                      <span className="text-textLight font-medium block truncate">{candidate.email}</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 text-sm">
                    <Phone className="w-4 h-4 text-textMuted mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="text-[10px] font-bold text-textMuted uppercase tracking-wider block">Phone Number</span>
                      <span className="text-textLight font-medium block">{candidate.phone || 'Not provided'}</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 text-sm">
                    <Link2 className="w-4 h-4 text-textMuted mt-0.5 flex-shrink-0" />
                    <div className="flex-grow min-w-0">
                      <span className="text-[10px] font-bold text-textMuted uppercase tracking-wider block">LinkedIn Profile</span>
                      {candidate.linkedin ? (
                        <a 
                          href={candidate.linkedin} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-indigo-400 hover:text-indigo-300 font-medium truncate block hover:underline"
                        >
                          {candidate.linkedin}
                        </a>
                      ) : (
                        <span className="text-textMuted italic">No LinkedIn profile registered</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 text-sm">
                    <FileText className="w-4 h-4 text-textMuted mt-0.5 flex-shrink-0" />
                    <div className="flex-grow min-w-0">
                      <span className="text-[10px] font-bold text-textMuted uppercase tracking-wider block">Resume attachment</span>
                      {candidate.resume_url ? (
                        <a 
                          href={candidate.resume_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-indigo-400 hover:text-indigo-300 font-medium truncate block hover:underline"
                        >
                          Download Resume Document
                        </a>
                      ) : (
                        <span className="text-textMuted italic">No resume file uploaded</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5">
                    <span className="text-[10px] font-bold text-textMuted uppercase tracking-wider block mb-1">Internal Notes</span>
                    <p className="text-sm text-textLight leading-relaxed bg-white/[0.02] border border-white/5 p-3 rounded-lg whitespace-pre-wrap">
                      {candidate.notes || 'No notes/comments registered for this candidate profile.'}
                    </p>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* RIGHT COLUMN: Hiring timeline audit trail */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Audit Log Activity Timeline */}
            <div className="glass-card p-6">
              <h2 className="text-base font-bold text-textLight mb-6 flex items-center space-x-2">
                <Activity className="w-5 h-5 text-accentPurple" />
                <span>Hiring Timeline & Audit Trail</span>
              </h2>

              {candidate.auditLogs.length === 0 ? (
                <div className="py-8 text-center text-textMuted text-sm">
                  No activity actions recorded on this profile.
                </div>
              ) : (
                <div className="relative pl-6 border-l border-white/10 space-y-6">
                  {candidate.auditLogs.map((log) => {
                    let logDiffText = 'Updated profile';
                    if (log.action === 'CREATE') {
                      logDiffText = 'Created candidate profile';
                    } else if (log.changed_fields) {
                      const keys = Object.keys(log.changed_fields);
                      if (keys.length > 0) {
                        logDiffText = keys.map(k => {
                          const val = log.changed_fields[k];
                          return `Changed ${k} from "${val.from === null ? 'Empty' : val.from}" to "${val.to === null ? 'Empty' : val.to}"`;
                        }).join(', ');
                      }
                    }

                    return (
                      <div key={log.id} className="relative">
                        {/* Timeline dot */}
                        <div className="absolute -left-[31px] top-1.5 w-2.5 h-2.5 rounded-full bg-accentPurple border border-background shadow-md shadow-accentPurple/25" />
                        
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                          <span className="text-xs font-semibold text-textLight bg-white/5 border border-white/10 py-0.5 px-2 rounded-full w-fit">
                            {log.actor_role} Action
                          </span>
                          <span className="text-[10px] text-textMuted flex items-center space-x-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{new Date(log.created_at).toLocaleString()}</span>
                          </span>
                        </div>
                        
                        <p className="text-sm text-textMuted mt-2 leading-relaxed font-medium">
                          {logDiffText}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

        </div>

      </main>
    </>
  );
}
