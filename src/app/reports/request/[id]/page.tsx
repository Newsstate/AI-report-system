import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { StatusBadge } from '@/components/shared/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/index';
import { Button } from '@/components/ui/button';
import { formatDate, formatRelativeTime, REPORT_TYPE_LABELS } from '@/lib/utils';
import { ArrowLeft, RefreshCw, Calendar, Tag, FileSpreadsheet, Clock } from 'lucide-react';
import Link from 'next/link';
import { RetryButton } from '@/components/reports/retry-button';

interface RequestPageProps {
  params: { id: string };
}

export default async function ReportRequestPage({ params }: RequestPageProps) {
  const supabase = createClient();

  const { data: request } = await supabase
    .from('report_requests')
    .select('*, clients(*)')
    .eq('id', params.id)
    .single();

  if (!request) notFound();

  const { data: logs } = await supabase
    .from('automation_logs')
    .select('*')
    .eq('report_request_id', params.id)
    .order('created_at', { ascending: false })
    .limit(20);

  const client = (request as any).clients;
  const isActive = ['pending', 'processing', 'ai_analyzing', 'generating'].includes(request.status);
  const isFailed = request.status === 'failed';

  return (
    <div className="p-8 max-w-4xl space-y-6">
      <div>
        <Link
          href="/reports"
          className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Reports
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {REPORT_TYPE_LABELS[request.report_type]}
            </h1>
            <p className="mt-1 text-muted-foreground">{client?.name}</p>
            <div className="mt-2 flex items-center gap-3">
              <StatusBadge status={request.status as any} />
              {request.priority !== 'normal' && (
                <span className={`text-xs font-medium ${
                  request.priority === 'urgent' ? 'text-rose-500' :
                  request.priority === 'high' ? 'text-amber-500' : 'text-muted-foreground'
                }`}>
                  {request.priority.toUpperCase()} priority
                </span>
              )}
            </div>
          </div>

          {isFailed && <RetryButton reportRequestId={request.id} />}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Details */}
        <Card>
          <CardHeader><CardTitle>Request Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <span className="text-muted-foreground">Period: </span>
                {request.date_range_start && request.date_range_end ? (
                  <span>{formatDate(request.date_range_start)} – {formatDate(request.date_range_end)}</span>
                ) : 'Not specified'}
              </div>
            </div>

            {request.keywords && request.keywords.length > 0 && (
              <div className="flex items-start gap-3 text-sm">
                <Tag className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <span className="text-muted-foreground block mb-2">Keywords:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {request.keywords.slice(0, 10).map((kw, i) => (
                      <span key={i} className="rounded-md bg-muted px-2 py-0.5 text-xs">{kw}</span>
                    ))}
                    {request.keywords.length > 10 && (
                      <span className="text-xs text-muted-foreground">+{request.keywords.length - 10} more</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {request.excel_file_name && (
              <div className="flex items-center gap-3 text-sm">
                <FileSpreadsheet className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate">{request.excel_file_name}</span>
              </div>
            )}

            <div className="flex items-center gap-3 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">
                Submitted {formatRelativeTime(request.created_at)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Automation Status */}
        <Card>
          <CardHeader><CardTitle>Automation Status</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {request.n8n_execution_id && (
              <div className="text-sm">
                <span className="text-muted-foreground">Execution ID: </span>
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{request.n8n_execution_id}</code>
              </div>
            )}
            {request.n8n_triggered_at && (
              <div className="text-sm">
                <span className="text-muted-foreground">Triggered: </span>
                {formatRelativeTime(request.n8n_triggered_at)}
              </div>
            )}
            {request.n8n_completed_at && (
              <div className="text-sm">
                <span className="text-muted-foreground">Completed: </span>
                {formatRelativeTime(request.n8n_completed_at)}
              </div>
            )}
            {request.retry_count > 0 && (
              <div className="text-sm">
                <span className="text-muted-foreground">Retries: </span>
                {request.retry_count}/3
              </div>
            )}
            {request.error_message && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 dark:border-rose-900 dark:bg-rose-950">
                <p className="text-xs font-medium text-rose-600 dark:text-rose-400">Error</p>
                <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">{request.error_message}</p>
              </div>
            )}

            {isActive && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900 dark:bg-blue-950">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-3.5 w-3.5 text-blue-500 animate-spin" />
                  <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                    Automation in progress...
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {request.work_done_notes && (
        <Card>
          <CardHeader><CardTitle>Work Done Notes</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">{request.work_done_notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Automation Logs */}
      {logs && logs.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Automation Log</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 px-6 py-3">
                  <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                    log.event_type === 'completed' ? 'bg-emerald-500' :
                    log.event_type === 'failed' ? 'bg-rose-500' :
                    log.event_type === 'triggered' ? 'bg-brand-500' :
                    'bg-amber-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{log.message}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatRelativeTime(log.created_at)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
