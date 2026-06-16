/**
 * Shared constants for the Horizon Recruiting Platform.
 * Single source of truth for pipeline stages and status styling.
 */

/** All valid candidate pipeline statuses, in workflow order. */
export const STATUS_OPTIONS = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'] as const;

export type CandidateStatus = (typeof STATUS_OPTIONS)[number];

/**
 * Returns Tailwind CSS classes for a candidate status badge.
 * Used across candidate list, detail page, and dashboard.
 */
export function getStatusStyle(status: string): string {
  switch (status) {
    case 'Hired':
      return 'bg-teal-500/10 text-teal-300 border-teal-500/20';
    case 'Rejected':
      return 'bg-red-500/10 text-red-300 border-red-500/20';
    case 'Offer':
      return 'bg-pink-500/10 text-pink-300 border-pink-500/20';
    case 'Interview':
      return 'bg-purple-500/10 text-purple-300 border-purple-500/20';
    case 'Screening':
      return 'bg-blue-500/10 text-blue-300 border-blue-500/20';
    default:
      return 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20';
  }
}
