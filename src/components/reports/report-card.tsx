'use client';

import Link from 'next/link';
import { FileText, Download, ExternalLink, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/index';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/status-badge';
import { formatDate, REPORT_TYPE_LABELS } from '@/lib/utils';
import type { ReportWithClient, ReportRequestWithClient } from '@/types/database';

interface ReportCardProps {
  item: ReportRequestWithClient | ReportWithClient;
  type: 'request' | 'report';
}

function isReport(item: ReportRequestWithClient | ReportWithClient): item is ReportWithClient {
  return 'executive_summary' in item;
}

export function ReportCard({ item, type }: ReportCardProps) {
  const report = isReport(item) ? item : null;
  const request = !isReport(item) ? item : null;

  const title = report?.title || REPORT_TYPE_LABELS[request?.report_type || ''] || 'Report';
  const status = report?.status || request?.status || 'pending';
  const clientName = item.clients?.name || 'Unknown Client';
  const brandColor = item.clients?.brand_color || '#6272f6';
  const created = item.created_at;

  return (
    <Card className="group border-border/50 transition-all hover:border-border">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Client color indicator */}
          <div
            className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white"
            style={{ backgroundColor: brandColor }}
          >
            <FileText className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate font-medium">{title}</h3>
                <p className="text-sm text-muted-foreground">{clientName}</p>
              </div>
              <StatusBadge status={status as any} />
            </div>

            {/* Period */}
            {(request?.date_range_start || report?.report_period_start) && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {formatDate(request?.date_range_start || report?.report_period_start || '')} –{' '}
                {formatDate(request?.date_range_end || report?.report_period_end || '')}
              </div>
            )}

            {/* Report insights preview */}
            {report?.executive_summary && (
              <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                {report.executive_summary.slice(0, 150)}...
              </p>
            )}

            <div className="mt-3 flex items-center gap-2">
              {type === 'report' && report && (
                <>
                  <Link href={`/reports/${report.id}`}>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                      View Report
                    </Button>
                  </Link>
                  {report.pdf_url && (
                    <a href={report.pdf_url} target="_blank" rel="noopener noreferrer">
                      <Button variant="ghost" size="sm">
                        <Download className="mr-1.5 h-3.5 w-3.5" />
                        PDF
                      </Button>
                    </a>
                  )}
                </>
              )}
              {type === 'request' && request && (
                <Link href={`/reports/request/${request.id}`}>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                    View Details
                  </Button>
                </Link>
              )}
              <span className="ml-auto text-xs text-muted-foreground">{formatDate(created)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
