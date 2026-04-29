import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateReportSummary, analyzeSEOData, createClientInsights } from '@/lib/ai';
import { z } from 'zod';

const analyzeSchema = z.object({
  action: z.enum(['generate_summary', 'analyze_data', 'client_insights']),
  reportRequestId: z.string().uuid().optional(),
  clientId: z.string().uuid().optional(),
  data: z.record(z.unknown()).optional(),
  context: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const parsed = analyzeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
    }

    const { action, reportRequestId, clientId, data, context } = parsed.data;

    switch (action) {
      case 'generate_summary': {
        if (!reportRequestId) {
          return NextResponse.json({ error: 'reportRequestId required' }, { status: 400 });
        }

        const { data: reportRequest } = await supabase
          .from('report_requests')
          .select('*, clients(*)')
          .eq('id', reportRequestId)
          .single();

        if (!reportRequest) {
          return NextResponse.json({ error: 'Report request not found' }, { status: 404 });
        }

        const summary = await generateReportSummary(
          reportRequest,
          (reportRequest as any).clients,
          data
        );

        return NextResponse.json({ data: summary });
      }

      case 'analyze_data': {
        if (!data || !context) {
          return NextResponse.json({ error: 'data and context required' }, { status: 400 });
        }

        const analysis = await analyzeSEOData(data, context);
        return NextResponse.json({ data: analysis });
      }

      case 'client_insights': {
        if (!clientId) {
          return NextResponse.json({ error: 'clientId required' }, { status: 400 });
        }

        const { data: client } = await supabase.from('clients').select('*').eq('id', clientId).single();
        if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

        const { data: historicalReports } = await supabase
          .from('reports')
          .select('id, title, created_at, metrics_snapshot')
          .eq('client_id', clientId)
          .order('created_at', { ascending: false })
          .limit(5);

        const insights = await createClientInsights(client, historicalReports || []);
        return NextResponse.json({ data: { insights } });
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('AI analysis error:', error);
    return NextResponse.json({ error: 'AI analysis failed' }, { status: 500 });
  }
}
