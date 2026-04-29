import { createClient } from '@/lib/supabase/server';
import { ReportCard } from '@/components/reports/report-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Card, CardContent } from '@/components/ui/index';
import { FileText } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export default async function ReportsPage() {
  const supabase = createClient();

  const [{ data: reportRequests }, { data: reports }] = await Promise.all([
    supabase
      .from('report_requests')
      .select('*, clients(id, name, logo_url, brand_color)')
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('reports')
      .select('*, clients(id, name, logo_url, brand_color)')
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  const pendingRequests = (reportRequests || []).filter((r) =>
    ['pending', 'processing', 'ai_analyzing', 'generating'].includes(r.status)
  );
  const completedRequests = (reportRequests || []).filter((r) =>
    ['completed', 'failed', 'cancelled'].includes(r.status)
  );

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">Track automation status and view generated reports</p>
        </div>
        <Link href="/new-report">
          <Button className="bg-brand-600 hover:bg-brand-700 text-white">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Report
          </Button>
        </Link>
      </div>

      {/* Active Automations */}
      {pendingRequests.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            Active Automations ({pendingRequests.length})
          </h2>
          <div className="space-y-3">
            {pendingRequests.map((req) => (
              <ReportCard key={req.id} item={req as any} type="request" />
            ))}
          </div>
        </div>
      )}

      {/* Generated Reports */}
      {reports && reports.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold">Generated Reports ({reports.length})</h2>
          <div className="space-y-3">
            {reports.map((report) => (
              <ReportCard key={report.id} item={report as any} type="report" />
            ))}
          </div>
        </div>
      )}

      {/* Completed Requests */}
      {completedRequests.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-muted-foreground">Completed Requests</h2>
          <div className="space-y-3">
            {completedRequests.map((req) => (
              <ReportCard key={req.id} item={req as any} type="request" />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!reportRequests?.length && !reports?.length && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <FileText className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No reports yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Submit your first report request to get started
          </p>
          <Link href="/new-report" className="mt-6">
            <Button className="bg-brand-600 hover:bg-brand-700 text-white">
              <PlusCircle className="mr-2 h-4 w-4" />
              Create First Report
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
