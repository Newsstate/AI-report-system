import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkAutomationStatus } from '@/lib/n8n';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const executionId = searchParams.get('executionId');
    const requestId = searchParams.get('requestId');

    if (!executionId && !requestId) {
      return NextResponse.json({ error: 'executionId or requestId required' }, { status: 400 });
    }

    let execId = executionId;

    // Look up execution ID from request ID
    if (requestId && !execId) {
      const { data: req } = await supabase
        .from('report_requests')
        .select('n8n_execution_id, status')
        .eq('id', requestId)
        .single();

      if (req?.n8n_execution_id) {
        execId = req.n8n_execution_id;
      }

      return NextResponse.json({ status: req?.status || 'unknown' });
    }

    const status = await checkAutomationStatus(execId!);
    return NextResponse.json({ success: true, execution: status });
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
