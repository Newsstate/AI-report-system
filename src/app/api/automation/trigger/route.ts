import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { triggerReportAutomation } from '@/lib/n8n';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { reportRequestId, clientName, clientWebsite } = body;

    if (!reportRequestId) {
      return NextResponse.json({ error: 'reportRequestId is required' }, { status: 400 });
    }

    // Fetch the full report request
    const { data: reportRequest, error } = await supabase
      .from('report_requests')
      .select('*')
      .eq('id', reportRequestId)
      .single();

    if (error || !reportRequest) {
      return NextResponse.json({ error: 'Report request not found' }, { status: 404 });
    }

    // Trigger n8n automation
    const result = await triggerReportAutomation(reportRequest, {
      name: clientName || 'Unknown',
      website: clientWebsite || null,
    });

    if (result.success) {
      // Update report request with execution ID and status
  await supabase
  .from<any>('report_requests')
  .update({
    status: 'processing',
    n8n_execution_id: result.executionId,
    n8n_triggered_at: new Date().toISOString(),
  })
  .eq('id', requestId);

      return NextResponse.json({
        success: true,
        executionId: result.executionId,
        message: 'Automation triggered successfully',
      });
    } else {
      // Mark as failed
      await supabase
        .from('report_requests')
        .update({
          status: 'failed',
          error_message: result.error,
        })
        .eq('id', reportRequestId);

      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error) {
    console.error('Trigger automation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
