import { type N8nWebhookPayload, type N8nExecutionStatus, type ReportRequest } from '@/types/database';
import { createClient } from '@/lib/supabase/server';

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
const N8N_WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET;
const N8N_API_URL = process.env.N8N_API_URL;
const N8N_API_KEY = process.env.N8N_API_KEY;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// =============================================================================
// TRIGGER REPORT AUTOMATION
// =============================================================================

export async function triggerReportAutomation(
  reportRequest: ReportRequest,
  clientData: { name: string; website: string | null }
): Promise<{ success: boolean; executionId?: string; error?: string }> {
  if (!N8N_WEBHOOK_URL) {
    console.warn('N8N_WEBHOOK_URL not configured. Simulating automation trigger.');
    return simulateAutomationTrigger(reportRequest.id);
  }

  const payload: N8nWebhookPayload = {
    reportRequestId: reportRequest.id,
    clientId: reportRequest.client_id,
    clientName: clientData.name,
    clientWebsite: clientData.website || '',
    reportType: reportRequest.report_type,
    dateRangeStart: reportRequest.date_range_start || '',
    dateRangeEnd: reportRequest.date_range_end || '',
    keywords: reportRequest.keywords || [],
    workDoneNotes: reportRequest.work_done_notes || '',
    customInstructions: reportRequest.custom_instructions || '',
    excelFileUrl: reportRequest.excel_file_url || undefined,
    callbackUrl: `${APP_URL}/api/automation/webhook`,
    timestamp: new Date().toISOString(),
  };

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (N8N_WEBHOOK_SECRET) {
      headers['X-Webhook-Secret'] = N8N_WEBHOOK_SECRET;
    }

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`n8n webhook failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json().catch(() => ({}));
    const executionId = data?.executionId || data?.id || `exec_${Date.now()}`;

    // Log the trigger event
    await logAutomationEvent(reportRequest.id, 'triggered', `Automation triggered successfully`, {
      executionId,
      payload: { reportType: payload.reportType, clientId: payload.clientId },
    });

    return { success: true, executionId };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to trigger n8n automation:', message);

    await logAutomationEvent(reportRequest.id, 'failed', `Trigger failed: ${message}`, {
      error: message,
    });

    return { success: false, error: message };
  }
}

// =============================================================================
// CHECK AUTOMATION STATUS
// =============================================================================

export async function checkAutomationStatus(
  executionId: string
): Promise<N8nExecutionStatus | null> {
  if (!N8N_API_URL || !N8N_API_KEY) {
    // Return mock status for development
    return {
      id: executionId,
      status: 'running',
      startedAt: new Date().toISOString(),
    };
  }

  try {
    const response = await fetch(`${N8N_API_URL}/executions/${executionId}`, {
      headers: {
        'X-N8N-API-KEY': N8N_API_KEY,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`Status check failed: ${response.status}`);
    }

    const data = await response.json();

    return {
      id: data.id,
      status: data.status,
      startedAt: data.startedAt,
      stoppedAt: data.stoppedAt,
      data: data.data,
    };
  } catch (error) {
    console.error('Failed to check automation status:', error);
    return null;
  }
}

// =============================================================================
// RETRY AUTOMATION
// =============================================================================

export async function retryAutomation(
  reportRequestId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    // Get the report request
    const { data: reportRequest, error } = await supabase
      .from('report_requests')
      .select('*, clients(name, website)')
      .eq('id', reportRequestId)
      .single();

    if (error || !reportRequest) {
      return { success: false, error: 'Report request not found' };
    }

    if (reportRequest.retry_count >= 3) {
      return { success: false, error: 'Maximum retry attempts reached (3)' };
    }

    // Update retry count and status
    await supabase
      .from('report_requests')
      .update({
        status: 'pending',
        retry_count: (reportRequest.retry_count || 0) + 1,
        error_message: null,
      })
      .eq('id', reportRequestId);

    const clientData = (reportRequest as any).clients || { name: 'Unknown', website: '' };

    // Trigger automation again
    const result = await triggerReportAutomation(reportRequest, clientData);

    if (result.success) {
      await supabase
        .from('report_requests')
        .update({
          status: 'processing',
          n8n_execution_id: result.executionId,
          n8n_triggered_at: new Date().toISOString(),
        })
        .eq('id', reportRequestId);

      await logAutomationEvent(reportRequestId, 'retried', 'Automation retried successfully', {
        executionId: result.executionId,
        attemptNumber: (reportRequest.retry_count || 0) + 1,
      });
    }

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: message };
  }
}

// =============================================================================
// PROCESS WEBHOOK CALLBACK (from n8n)
// =============================================================================

export async function processAutomationCallback(
  reportRequestId: string,
  status: 'completed' | 'failed',
  data?: Record<string, unknown>,
  errorMessage?: string
): Promise<{ success: boolean }> {
  const supabase = createClient();

  try {
    if (status === 'completed' && data) {
      // Store the raw data
      if (Object.keys(data).length > 0) {
        await supabase.from('report_data').insert({
          report_request_id: reportRequestId,
          data_type: 'raw_excel',
          source: 'n8n',
          data: data as any,
          processed: false,
        });
      }

      await supabase
        .from('report_requests')
        .update({
          status: 'ai_analyzing',
          n8n_completed_at: new Date().toISOString(),
        })
        .eq('id', reportRequestId);

      await logAutomationEvent(reportRequestId, 'completed', 'Automation completed successfully', {
        dataReceived: true,
      });
    } else {
      await supabase
        .from('report_requests')
        .update({
          status: 'failed',
          error_message: errorMessage || 'Automation failed',
          n8n_completed_at: new Date().toISOString(),
        })
        .eq('id', reportRequestId);

      await logAutomationEvent(reportRequestId, 'failed', errorMessage || 'Automation failed', {
        error: errorMessage,
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to process automation callback:', error);
    return { success: false };
  }
}

// =============================================================================
// HELPERS
// =============================================================================

async function logAutomationEvent(
  reportRequestId: string,
  eventType: string,
  message: string,
  payload?: Record<string, unknown>
) {
  try {
    const supabase = createClient();
    await supabase.from('automation_logs').insert({
      report_request_id: reportRequestId,
      event_type: eventType as any,
      message,
      payload: payload as any,
    });
  } catch (error) {
    console.error('Failed to log automation event:', error);
  }
}

async function simulateAutomationTrigger(
  reportRequestId: string
): Promise<{ success: boolean; executionId?: string }> {
  // Simulate a delay and return a mock execution ID
  await new Promise((resolve) => setTimeout(resolve, 500));
  const executionId = `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  console.log(`[DEV] Simulated automation trigger for request ${reportRequestId}: ${executionId}`);

  return { success: true, executionId };
}
