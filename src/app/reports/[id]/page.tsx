import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { StatusBadge } from '@/components/shared/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/index';
import { Badge } from '@/components/ui/index';
import { Button } from '@/components/ui/button';
import { formatDate, REPORT_TYPE_LABELS } from '@/lib/utils';
import { Download, ArrowLeft, TrendingUp, TrendingDown, Minus, Lightbulb, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import type { AIReportSummary } from '@/types/database';

interface ReportPageProps {
  params: { id: string };
}

export default async function ReportPage({ params }: ReportPageProps) {
  const supabase = createClient();

  const { data: report } = await supabase
    .from('reports')
    .select('*, clients(*)')
    .eq('id', params.id)
    .single();

  if (!report) notFound();

  const client = (report as any).clients;
  const insights = (report.key_insights as AIReportSummary['keyInsights']) || [];
  const recommendations = (report.recommendations as AIReportSummary['recommendations']) || [];
  const metrics = (report.metrics_snapshot as AIReportSummary['metricsSnapshot']) || {};

  const impactIcon = {
    positive: <TrendingUp className="h-4 w-4 text-emerald-500" />,
    negative: <TrendingDown className="h-4 w-4 text-rose-500" />,
    neutral: <Minus className="h-4 w-4 text-muted-foreground" />,
  };

  const priorityConfig = {
    high: { label: 'High', variant: 'destructive' as const },
    medium: { label: 'Medium', variant: 'warning' as const },
    low: { label: 'Low', variant: 'secondary' as const },
  };

  return (
    <div className="p-8 max-w-5xl space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/reports"
          className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Reports
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {/* Client color badge */}
            <div
              className="mt-1 h-3 w-3 rounded-full shrink-0"
              style={{ backgroundColor: client?.brand_color || '#6272f6' }}
            />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{report.title}</h1>
              <p className="mt-1 text-muted-foreground">
                {client?.name} · {REPORT_TYPE_LABELS[report.report_type] || report.report_type}
              </p>
              <div className="mt-2 flex items-center gap-3">
                <StatusBadge status={report.status as any} />
                {report.report_period_start && (
                  <span className="text-sm text-muted-foreground">
                    {formatDate(report.report_period_start)} – {formatDate(report.report_period_end || '')}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {report.pdf_url && (
              <a href={report.pdf_url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" /> PDF
                </Button>
              </a>
            )}
            {report.ppt_url && (
              <a href={report.ppt_url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" /> PPT
                </Button>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Snapshot */}
      {Object.keys(metrics).length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {metrics.organicTraffic && (
            <Card className="border-border/50">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Organic Traffic</p>
                <p className="mt-1 text-2xl font-bold">{metrics.organicTraffic.toLocaleString()}</p>
                {metrics.trafficChange !== undefined && (
                  <p className={`text-xs mt-1 ${metrics.trafficChange >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {metrics.trafficChange >= 0 ? '+' : ''}{(metrics.trafficChange * 100).toFixed(1)}%
                  </p>
                )}
              </CardContent>
            </Card>
          )}
          {metrics.keywordsRanking && (
            <Card className="border-border/50">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Keywords</p>
                <p className="mt-1 text-2xl font-bold">{metrics.keywordsRanking}</p>
              </CardContent>
            </Card>
          )}
          {metrics.avgPosition && (
            <Card className="border-border/50">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Avg Position</p>
                <p className="mt-1 text-2xl font-bold">{metrics.avgPosition}</p>
              </CardContent>
            </Card>
          )}
          {metrics.backlinks && (
            <Card className="border-border/50">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Backlinks</p>
                <p className="mt-1 text-2xl font-bold">{metrics.backlinks.toLocaleString()}</p>
              </CardContent>
            </Card>
          )}
          {metrics.domainAuthority && (
            <Card className="border-border/50">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Domain Auth.</p>
                <p className="mt-1 text-2xl font-bold">{metrics.domainAuthority}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Executive Summary */}
      {report.executive_summary && (
        <Card>
          <CardHeader>
            <CardTitle>Executive Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {report.executive_summary.split('\n\n').map((para, i) => (
                <p key={i} className="text-sm leading-relaxed text-foreground/90 mb-4 last:mb-0">
                  {para}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Insights */}
      {insights.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            Key Insights
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {insights.map((insight, i) => (
              <Card key={i} className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                      {impactIcon[insight.impact] || impactIcon.neutral}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">{insight.title}</h4>
                        {insight.metric && (
                          <span className={`text-xs font-bold ${
                            insight.impact === 'positive' ? 'text-emerald-500' :
                            insight.impact === 'negative' ? 'text-rose-500' :
                            'text-muted-foreground'
                          }`}>
                            {insight.metric}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-brand-500" />
            Recommendations
          </h2>
          <div className="space-y-3">
            {recommendations.map((rec, i) => (
              <Card key={i} className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600/10 text-xs font-bold text-brand-600">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-medium text-sm">{rec.title}</h4>
                        <Badge variant={
                          rec.priority === 'high' ? 'destructive' :
                          rec.priority === 'medium' ? 'warning' : 'secondary'
                        }>
                          {rec.priority}
                        </Badge>
                        <Badge variant="outline" className="text-xs capitalize">
                          {rec.category}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                        {rec.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
