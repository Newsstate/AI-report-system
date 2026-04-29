import { NextRequest, NextResponse } from 'next/server';
import { processAutomationCallback } from '@/lib/n8n';
import { generateReportSummary } from '@/lib/ai';
import { webhookCallbackSchema } from '@/lib/validations';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate webhook secret if configured
    const webhookSecret = process.env.N8N_WEBHOOK_SECRET;
    if (webhookSecret && body.secret !== webhookSecret) {
      const headerSecret = request.headers.get('x-webhook-secret');
      if (headerSecret !== webhookSecret) {
        return NextResponse.json({ error: 'Invalid webhook secret' }, { status: 401 });
      }
    }

    // Validate payload
    const parsed = webhookCallbackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { reportRequestId, status, data, errorMessage } = parsed.data;

    // Process the callback
    await processAutomationCallback(
      reportRequestId,
      status,
      data as Record<string, unknown> | undefined,
      errorMessage
    );

    // If completed, trigger AI analysis
    if (status === 'completed') {
      // Run AI analysis asynchronously (don't block the webhook response)
      runAIAnalysis(reportRequestId, data as Record<string, unknown> | undefined).catch(
        console.error
      );
    }

    return NextResponse.json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function runAIAnalysis(
  reportRequestId: string,
  rawData?: Record<string, unknown>
) {
  const supabase = createAdminClient();

  try {
    // Get report request with client
    const { data: reportRequest } = await supabase
      .from('report_requests')
      .select('*, clients(*)')
      .eq('id', reportRequestId)
      .single();

    if (!reportRequest) return;

    const client = (reportRequest as any).clients;

    // Update status to ai_analyzing
    await supabase
      .from('report_requests')
      .update({ status: 'ai_analyzing' })
      .eq('id', reportRequestId);

    // Generate AI report summary
    const aiSummary = await generateReportSummary(reportRequest, client, rawData);

    // Update status to generating
    await supabase
      .from('report_requests')
      .update({ status: 'generating' })
      .eq('id', reportRequestId);

    // Create the final report
    const { data: report } = await supabase
      .from('reports')
      .insert({
        report_request_id: reportRequestId,
        client_id: reportRequest.client_id,
        created_by: reportRequest.requested_by,
        title: `${client?.name} - ${getReportTypeLabel(reportRequest.report_type)} ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
        report_type: reportRequest.report_type,
        executive_summary: aiSummary.executiveSummary,
        key_insights: aiSummary.keyInsights as any,
        recommendations: aiSummary.recommendations as any,
        metrics_snapshot: aiSummary.metricsSnapshot as any,
        status: 'published',
        report_period_start: reportRequest.date_range_start,
        report_period_end: reportRequest.date_range_end,
        published_at: new Date().toISOString(),
      })
      .select()
      .single();

    // Mark report request as completed
    await supabase
      .from('report_requests')
      .update({
        status: 'completed',
        n8n_completed_at: new Date().toISOString(),
      })
      .eq('id', reportRequestId);

    // Log activity
    if (report) {
      await supabase.from('activity_feed').insert({
        user_id: reportRequest.requested_by,
        entity_type: 'report',
        entity_id: report.id,
        action: 'Report generated',
        description: `AI report generated for ${client?.name}`,
      });
    }

    console.log(`✅ AI report generated for request ${reportRequestId}`);
  } catch (error) {
    console.error('AI analysis failed:', error);
    await supabase
      .from('report_requests')
      .update({
        status: 'failed',
        error_message: 'AI analysis failed: ' + (error instanceof Error ? error.message : 'Unknown error'),
      })
      .eq('id', reportRequestId);
  }
}

function getReportTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    monthly_seo: 'Monthly SEO Report',
    technical_audit: 'Technical Audit',
    keyword_analysis: 'Keyword Analysis',
    competitor_analysis: 'Competitor Analysis',
    backlink_audit: 'Backlink Audit',
    content_gap: 'Content Gap Analysis',
    custom: 'Custom Report',
  };
  return labels[type] || 'Report';
}
