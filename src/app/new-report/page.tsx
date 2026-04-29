import { createClient } from '@/lib/supabase/server';
import { NewReportForm } from '@/components/reports/new-report-form';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function NewReportPage() {
  const supabase = createClient();

  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <Link
          href="/reports"
          className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Reports
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">New Report Request</h1>
        <p className="text-muted-foreground">
          Fill in the details below to trigger the AI SEO automation workflow
        </p>
      </div>
      <NewReportForm clients={clients || []} />
    </div>
  );
}
