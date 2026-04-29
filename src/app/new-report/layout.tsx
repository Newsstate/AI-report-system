import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/dashboard/sidebar';

export default async function NewReportLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');
  const { data: profile } = await supabase.from('profiles').select('full_name, agency_name').eq('id', user.id).single();
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar user={{ email: user.email, full_name: profile?.full_name || undefined, agency_name: profile?.agency_name || undefined }} />
      <main className="flex-1 overflow-y-auto scrollbar-thin"><div className="page-enter min-h-full">{children}</div></main>
    </div>
  );
}
