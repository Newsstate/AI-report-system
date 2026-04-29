import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, formatStr = 'MMM d, yyyy') {
  return format(new Date(date), formatStr);
}

export function formatRelativeTime(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatPercentage(value: number, decimals = 1) {
  const sign = value > 0 ? '+' : '';
  return `${sign}${(value * 100).toFixed(decimals)}%`;
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}

export function truncate(str: string, length: number) {
  if (str.length <= length) return str;
  return str.slice(0, length) + '...';
}

export function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function generateShareToken() {
  return `share_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`;
}

export const REPORT_TYPE_LABELS: Record<string, string> = {
  monthly_seo: 'Monthly SEO Report',
  technical_audit: 'Technical SEO Audit',
  keyword_analysis: 'Keyword Analysis',
  competitor_analysis: 'Competitor Analysis',
  backlink_audit: 'Backlink Audit',
  content_gap: 'Content Gap Analysis',
  custom: 'Custom Report',
};

export const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  processing: { label: 'Processing', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  ai_analyzing: { label: 'AI Analyzing', color: 'text-violet-500', bg: 'bg-violet-500/10' },
  generating: { label: 'Generating', color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  completed: { label: 'Completed', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  failed: { label: 'Failed', color: 'text-rose-500', bg: 'bg-rose-500/10' },
  cancelled: { label: 'Cancelled', color: 'text-slate-500', bg: 'bg-slate-500/10' },
  draft: { label: 'Draft', color: 'text-slate-500', bg: 'bg-slate-500/10' },
  published: { label: 'Published', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  archived: { label: 'Archived', color: 'text-slate-400', bg: 'bg-slate-400/10' },
} as const;

export function getInitials(name: string) {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function fileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (i < maxRetries - 1) {
        await delay(baseDelay * Math.pow(2, i));
      }
    }
  }

  throw lastError!;
}
