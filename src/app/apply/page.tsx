'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  User, Mail, Phone, Link2, FileCheck, FileText, 
  ArrowLeft, ArrowRight, AlertCircle, CheckCircle, Briefcase 
} from 'lucide-react';

export default function CandidateApplyPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Basic Client-Side Validation
    if (!name.trim()) {
      setError('Full Name is required');
      setLoading(false);
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      let finalResumeUrl = resumeUrl.trim();

      // Handle PDF upload if a file was selected
      if (resumeFile) {
        const formData = new FormData();
        formData.append('file', resumeFile);

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

      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          linkedin: linkedin.trim() || null,
          resume_url: finalResumeUrl || null,
          notes: notes.trim() || null
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit application');
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during submission.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex-grow flex flex-col justify-center items-center px-4">
        <div className="w-full max-w-lg glass-card p-10 text-center relative overflow-hidden">
          {/* Border glow effect */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500" />
          
          <div className="inline-flex items-center justify-center p-4 bg-emerald-500/10 rounded-2xl mb-6 border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
            <CheckCircle className="w-12 h-12 text-emerald-400 animate-pulse" />
          </div>

          <h1 className="text-3xl font-extrabold text-textLight tracking-tight mb-4">
            Application Received!
          </h1>
          <p className="text-sm text-textMuted leading-relaxed mb-8">
            Thank you for applying to join the team at Horizon. We have successfully recorded your details. Our recruiting team will review your application shortly and get in touch with you.
          </p>

          <Link
            id="return-to-portal-btn"
            href="/"
            className="inline-flex items-center justify-center space-x-2 py-3 px-6 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-sm font-semibold text-textLight transition-all duration-150"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Login Portal</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col justify-center items-center px-4 py-12 relative">
      {/* Branding Header */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4 shadow-lg shadow-indigo-500/20">
          <Briefcase className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          Join Horizon
        </h1>
        <p className="text-sm text-textMuted mt-2 max-w-md mx-auto">
          Submit your professional application to our recruiting pipeline.
        </p>
      </div>

      <div className="w-full max-w-xl glass-card p-8 relative overflow-hidden">
        {/* Border glow effect */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-textLight">Candidate Application Form</h2>
          <Link
            href="/"
            className="text-xs font-semibold text-textMuted hover:text-textLight transition-colors flex items-center space-x-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Portal Login</span>
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-950/40 border border-red-500/30 flex items-start space-x-3 text-red-200 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">
              Full Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3.5 w-5 h-5 text-textMuted" />
              <input
                id="apply-name"
                type="text"
                required
                className="w-full glass-input pl-11"
                placeholder="First and last name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-5 h-5 text-textMuted" />
                <input
                  id="apply-email"
                  type="email"
                  required
                  className="w-full glass-input pl-11"
                  placeholder="yourname@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3.5 w-5 h-5 text-textMuted" />
                <input
                  id="apply-phone"
                  type="tel"
                  className="w-full glass-input pl-11"
                  placeholder="+1 (555) 123-4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">
              LinkedIn Profile URL
            </label>
            <div className="relative">
              <Link2 className="absolute left-3 top-3.5 w-5 h-5 text-textMuted" />
              <input
                id="apply-linkedin"
                type="url"
                className="w-full glass-input pl-11"
                placeholder="https://linkedin.com/in/username"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">
              Resume PDF Upload
            </label>
            <div className="relative flex items-center">
              <FileCheck className="absolute left-3 w-5 h-5 text-textMuted" />
              <input
                id="apply-resume-file"
                type="file"
                accept=".pdf,application/pdf"
                className="w-full glass-input pl-11 py-[0.4rem] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-500/20 file:text-indigo-300 hover:file:bg-indigo-500/30 cursor-pointer"
                onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
              />
            </div>
            <p className="text-xs text-textMuted mt-1.5 ml-1">Optional. Maximum file size: 5MB.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-textMuted uppercase tracking-wider mb-2">
              Cover Letter / Message
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3.5 w-5 h-5 text-textMuted" />
              <textarea
                id="apply-notes"
                rows={4}
                className="w-full glass-input pl-11 min-h-[100px]"
                placeholder="Tell us about yourself, your skills, and why you want to join Horizon..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <button
            id="apply-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium flex items-center justify-center space-x-2 transition-all duration-200 shadow-md shadow-indigo-600/10 hover:shadow-indigo-500/20 disabled:opacity-50"
          >
            <span>{loading ? 'Submitting Application...' : 'Submit Application'}</span>
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
