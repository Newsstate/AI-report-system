import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ClientCard } from '@/components/clients/client-card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Users } from 'lucide-react';

export default async function ClientsPage() {
  const supabase = createClient();

  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .order('name', { ascending: true });

  // Get report counts per client
  const { data: reportCounts } = await supabase
    .from('report_requests')
    .select('client_id')
    .in('client_id', (clients || []).map((c) => c.id));

  const countMap = (reportCounts || []).reduce(
    (acc, row) => {
      acc[row.client_id] = (acc[row.client_id] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">
            {clients?.length || 0} {clients?.length === 1 ? 'client' : 'clients'} total
          </p>
        </div>
        <Link href="/clients/new">
          <Button className="bg-brand-600 hover:bg-brand-700 text-white">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        </Link>
      </div>

      {/* Client Grid */}
      {clients && clients.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              reportCount={countMap[client.id] || 0}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Users className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No clients yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Add your first client to start generating reports
          </p>
          <Link href="/clients/new" className="mt-6">
            <Button className="bg-brand-600 hover:bg-brand-700 text-white">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Your First Client
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
