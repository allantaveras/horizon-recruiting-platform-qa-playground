'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import { supabase } from '@/lib/supabase';
import { 
  Search, Plus, Filter, User, Mail, Phone, Link2, 
  FileCheck, FileText, ChevronRight, X, AlertCircle
} from 'lucide-react';
import { STATUS_OPTIONS, getStatusStyle } from '@/lib/constants';

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  linkedin: string;
  resume_url: string;
  status: string;
  created_at: string;
}

export default function CandidatesList() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [userRole, setUserRole] = useState('Viewer');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function handleStatusChange(candidateId: string, newStatus: string) {
    setUpdatingId(candidateId);
    setStatusError(null);
    try {
      const res = await fetch(`/api/candidates/${candidateId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update candidate status');
      }

      setCandidates(prev =>
        prev.map(c => (c.id === candidateId ? { ...c, status: newStatus } : c))
      );
    } catch (err: any) {
      setStatusError(err.message || 'Error updating status');
    } finally {
      setUpdatingId(null);
    }
  }

  // Add Candidate Form Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formLinkedin, setFormLinkedin] = useState('');
  const [formResume, setFormResume] = useState('');
  const [formResumeFile, setFormResumeFile] = useState<File | null>(null);
  const [formStatus, setFormStatus] = useState('Applied');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    async function loadUserRole() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUserRole(session.user.user_metadata?.role || 'Viewer');
        }
      } catch (e) {
        // Intentional swallow: fallback to Viewer role if session request fails.
      }
    }
    loadUserRole();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    loadCandidates();
  }, [debouncedSearch, selectedStatus]);

  async function loadCandidates() {
    setLoading(true);
    try {
      const url = new URL('/api/candidates', window.location.origin);
      if (debouncedSearch) url.searchParams.set('search', debouncedSearch);
      if (selectedStatus) url.searchParams.set('status', selectedStatus);

      const res = await fetch(url.toString(), { cache: 'no-store' });
      if (!res.ok) throw new Error('Could not retrieve candidate lists');
      const data = await res.json();
      setCandidates(data);
    } catch (err: any) {
      setError(err.message || 'Error loading candidates');
    } finally {
      setLoading(false);
    }
  }

  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSubmitting(true);

    if (!formName.trim()) {
      setFormError('Candidate Name is required');
      setFormSubmitting(false);
      return;
    }
    if (!formEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEmail)) {
      setFormError('Please enter a valid email address');
      setFormSubmitting(false);
      return;
    }

    try {
      let finalResumeUrl = formResume.trim();

      // Handle PDF upload if a file was selected
      if (formResumeFile) {
        const formData = new FormData();
        formData.append('file', formResumeFile);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          const data = await uploadRes.json();
          throw new Error(data.error || 'Failed to upload resume file');
        }

        const uploadData = await uploadRes.json();
        finalResumeUrl = uploadData.url;
      }

      const res = await fetch('/api/candidates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formName,
          email: formEmail,
          phone: formPhone,
          linkedin: formLinkedin,
          resume_url: finalResumeUrl,
          status: formStatus,
          notes: formNotes,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create candidate record');
      }

      // Reset Form and Load Candidates
      setFormName('');
      setFormEmail('');
      setFormPhone('');
      setFormLinkedin('');
      setFormResume('');
      setFormStatus('Applied');
      setFormNotes('');
      setModalOpen(false);
      loadCandidates();
    } catch (err: any) {
      setFormError(err.message || 'Error occurred');
    } finally {
      setFormSubmitting(false);
    }
  };


  return (
    <>
      <Navigation />
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        
        {/* Header Roster */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-textLight tracking-tight">Candidate Directory</h1>
            <p className="text-textMuted text-sm mt-1">Audit profile records and track evaluation statuses.</p>
          </div>

          {userRole !== 'Viewer' && (
            <button
              id="add-candidate-btn"
              onClick={() => setModalOpen(true)}
              className="mt-4 sm:mt-0 py-2.5 px-4 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium flex items-center justify-center space-x-2 transition-all duration-200 shadow-md shadow-indigo-600/10 hover:shadow-indigo-500/20"
            >
              <Plus className="w-4 h-4" />
              <span>Add Candidate</span>
            </button>
          )}
        </div>

        {statusError && (
          <div className="mb-6 p-4 rounded-lg bg-red-950/40 border border-red-500/30 flex items-start justify-between text-red-200 text-sm animate-fade-in">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
              <span>{statusError}</span>
            </div>
            <button 
              onClick={() => setStatusError(null)}
              className="text-textMuted hover:text-textLight transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="glass-card p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-3 w-4 h-4 text-textMuted" />
            <input
              id="search-input"
              type="text"
              className="w-full glass-input pl-10"
              placeholder="Search candidates by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-3">
            <Filter className="w-4 h-4 text-textMuted" />
            <select
              id="filter-status-select"
              className="glass-input bg-cardBackground"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Candidates Table Grid */}
        {error ? (
          <div className="p-6 rounded-xl bg-red-950/20 border border-red-500/30 text-red-200">
            <p className="font-semibold">Failed to load Candidate logs</p>
            <p className="text-sm text-red-300 mt-1">{error}</p>
          </div>
        ) : loading ? (
          <div className="glass-card p-6 divide-y divide-white/5 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="py-4 h-16 bg-white/[0.01]" />
            ))}
          </div>
        ) : candidates.length === 0 ? (
          <div className="glass-card p-12 text-center text-textMuted">
            <p className="text-base font-medium">No candidates match your queries</p>
            <p className="text-xs mt-1">Try resetting search filters or register a new candidate.</p>
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left" id="candidates-table">
                <thead>
                  <tr className="border-b border-white/5 text-textMuted text-xs font-semibold uppercase tracking-wider bg-white/[0.01]">
                    <th className="py-3.5 px-6">Name</th>
                    <th className="py-3.5 px-6">Email / Phone</th>
                    <th className="py-3.5 px-6">Hiring Status</th>
                    <th className="py-3.5 px-6">Date Registered</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                  {candidates.map((c) => (
                    <tr key={c.id} className="group hover:bg-white/[0.01] transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-500/10">
                            <User className="w-4 h-4 text-indigo-300" />
                          </div>
                          <div>
                            <span className="font-bold text-textLight block">{c.name}</span>
                            <span className="text-[10px] text-textMuted flex items-center space-x-1 mt-0.5">
                              {c.linkedin ? (
                                <a href={c.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400">LinkedIn</a>
                              ) : (
                                <span>No LinkedIn Profile</span>
                              )}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col text-xs space-y-0.5">
                          <span className="text-textLight font-medium flex items-center space-x-1.5">
                            <Mail className="w-3.5 h-3.5 text-textMuted" />
                            <span>{c.email}</span>
                          </span>
                          {c.phone && (
                            <span className="text-textMuted flex items-center space-x-1.5">
                              <Phone className="w-3.5 h-3.5 text-textMuted" />
                              <span>{c.phone}</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {userRole === 'Viewer' ? (
                          <span className={`px-2.5 py-0.75 rounded-full text-xs font-semibold border ${getStatusStyle(c.status)}`}>
                            {c.status}
                          </span>
                        ) : (
                          <div className="relative inline-block">
                            <select
                              value={c.status}
                              onChange={(e) => handleStatusChange(c.id, e.target.value)}
                              disabled={updatingId === c.id}
                              className={`appearance-none bg-transparent px-2.5 py-1 pr-7 rounded-full text-xs font-semibold border cursor-pointer focus:outline-none transition-all duration-200 hover:scale-[1.02] ${getStatusStyle(c.status)} ${updatingId === c.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {STATUS_OPTIONS.map(opt => (
                                <option key={opt} value={opt} className="bg-[#0a0d16] text-[#f8fafc]">{opt}</option>
                              ))}
                            </select>
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[8px] opacity-70">▼</span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-textMuted text-xs">
                        {new Date(c.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <a
                          id={`view-details-${c.id}`}
                          href={`/candidates/${c.id}`}
                          className="inline-flex items-center justify-center p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-textLight text-xs font-semibold space-x-1.5"
                        >
                          <span>Review</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add Candidate Slide Drawer Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity duration-300">
            <div className="w-full max-w-lg bg-background/95 border-l border-white/10 h-full p-8 overflow-y-auto flex flex-col justify-between shadow-2xl relative">
              
              <div>
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-xl font-bold text-textLight">Add New Candidate</h2>
                    <p className="text-xs text-textMuted mt-1">Initialize record logs and check pipeline stage.</p>
                  </div>
                  <button 
                    id="close-modal-btn"
                    onClick={() => { setModalOpen(false); setFormError(null); }}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-textMuted hover:text-textLight transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {formError && (
                  <div className="mb-6 p-4 rounded-lg bg-red-950/40 border border-red-500/30 flex items-start space-x-3 text-red-200 text-sm">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
                    <span>{formError}</span>
                  </div>
                )}

                <form id="add-candidate-form" onSubmit={handleAddCandidate} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-2">
                      Full Name *
                    </label>
                    <input
                      id="form-name"
                      type="text"
                      required
                      placeholder="e.g. John Miller"
                      className="w-full glass-input"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-2">
                        Email Address *
                      </label>
                      <input
                        id="form-email"
                        type="email"
                        required
                        placeholder="john.m@company.com"
                        className="w-full glass-input"
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-2">
                        Phone Number
                      </label>
                      <input
                        id="form-phone"
                        type="text"
                        placeholder="+1 (555) 123-4567"
                        className="w-full glass-input"
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-2">
                      LinkedIn Profile URL
                    </label>
                    <div className="relative">
                      <Link2 className="absolute left-3 top-3.5 w-4 h-4 text-textMuted" />
                      <input
                        id="form-linkedin"
                        type="url"
                        placeholder="https://linkedin.com/in/username"
                        className="w-full glass-input pl-10"
                        value={formLinkedin}
                        onChange={(e) => setFormLinkedin(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-2">
                      Resume PDF Upload
                    </label>
                    <div className="relative flex items-center">
                      <FileCheck className="absolute left-3 w-4 h-4 text-textMuted" />
                      <input
                        id="form-resume-file"
                        type="file"
                        accept=".pdf,application/pdf"
                        className="w-full glass-input pl-10 py-[0.4rem] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-500/20 file:text-indigo-300 hover:file:bg-indigo-500/30 cursor-pointer"
                        onChange={(e) => setFormResumeFile(e.target.files?.[0] || null)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-2">
                      Initial Pipeline Status
                    </label>
                    <select
                      id="form-status"
                      className="w-full glass-input bg-cardBackground"
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                    >
                      {STATUS_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-2">
                      Internal Notes / Comments
                    </label>
                    <textarea
                      id="form-notes"
                      rows={3}
                      placeholder="Enter screening background or referral notes..."
                      className="w-full glass-input"
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                    />
                  </div>
                </form>
              </div>

              <div className="border-t border-white/5 pt-6 mt-8 flex items-center justify-end space-x-3">
                <button
                  id="cancel-modal-btn"
                  onClick={() => { setModalOpen(false); setFormError(null); }}
                  className="py-2.5 px-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold text-textLight transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="submit-candidate-btn"
                  onClick={handleAddCandidate}
                  disabled={formSubmitting}
                  className="py-2.5 px-4 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-xs font-semibold text-white transition-all disabled:opacity-50"
                >
                  {formSubmitting ? 'Creating...' : 'Register Candidate'}
                </button>
              </div>

            </div>
          </div>
        )}
      </main>
    </>
  );
}
