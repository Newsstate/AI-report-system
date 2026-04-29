import { ClientForm } from '@/components/clients/client-form';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewClientPage() {
  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <Link
          href="/clients"
          className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Clients
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Add New Client</h1>
        <p className="text-muted-foreground">Create a new client profile for your agency</p>
      </div>
      <ClientForm />
    </div>
  );
}
