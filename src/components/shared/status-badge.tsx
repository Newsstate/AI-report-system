'use client';

import { cn, STATUS_CONFIG } from '@/lib/utils';
import { type ReportRequestStatus, type ReportStatus } from '@/types/database';

type Status = ReportRequestStatus | ReportStatus;

interface StatusBadgeProps {
  status: Status;
  className?: string;
  showDot?: boolean;
}

export function StatusBadge({ status, className, showDot = true }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || {
    label: status,
    color: 'text-slate-500',
    bg: 'bg-slate-500/10',
  };

  const isAnimated = status === 'processing' || status === 'ai_analyzing' || status === 'generating';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        config.bg,
        config.color,
        className
      )}
    >
      {showDot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            config.color.replace('text-', 'bg-'),
            isAnimated && 'animate-pulse'
          )}
        />
      )}
      {config.label}
    </span>
  );
}
