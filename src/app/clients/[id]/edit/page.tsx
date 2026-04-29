import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ClientForm } from '@/components/clients/client-form';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface EditClientPageProps {
  params: { id: string };
}

export default async function EditClientPage({ params }: EditClientPageProps) {
  const supabase = createClient();

  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', params.id)
    .single();

  if (!client) notFound();

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <Link
          href="/clients"
          className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Clients
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Edit Client</h1>
        <p className="text-muted-foreground">Update {client.name}'s information</p>
      </div>
      <ClientForm client={client} />
    </div>
  );
}
