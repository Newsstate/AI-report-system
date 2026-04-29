import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { retryAutomation } from '@/lib/n8n';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { reportRequestId } = await request.json();
    if (!reportRequestId) {
      return NextResponse.json({ error: 'reportRequestId is required' }, { status: 400 });
    }

    const result = await retryAutomation(reportRequestId);

    if (result.success) {
      return NextResponse.json({ success: true, message: 'Automation retry triggered' });
    } else {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
  } catch (error) {
    console.error('Retry automation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
