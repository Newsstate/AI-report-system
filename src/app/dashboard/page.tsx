import { createClient } from '@/lib/supabase/server';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { ReportCard } from '@/components/reports/report-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/index';
import { PlusCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { DashboardStats } from '@/types/database';

export default async function DashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch dashboard stats in parallel
  const [
    { count: totalClients },
    { count: activeReports },
    { count: pendingAutomations },
    { count: completedThisMonth },
    { data: recentActivity },
    { data: recentRequests },
  ] = await Promise.all([
    supabase.from('clients').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase
      .from('report_requests')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending', 'processing', 'ai_analyzing', 'generating']),
    supabase
      .from('report_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed')
      .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    supabase
      .from('activity_feed')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('report_requests')
      .select('*, clients(id, name, logo_url, brand_color)')
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const stats: DashboardStats = {
    totalClients: totalClients || 0,
    activeReports: activeReports || 0,
    pendingAutomations: pendingAutomations || 0,
    completedThisMonth: completedThisMonth || 0,
    recentActivity: recentActivity || [],
    reportsByStatus: {},
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back. Here's what's happening.</p>
        </div>
        <Link href="/new-report">
          <Button className="bg-brand-600 hover:bg-brand-700 text-white">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Report
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <StatsCards stats={stats} />

      {/* Recent Requests & Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Report Requests */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Recent Requests</h2>
            <Link href="/reports" className="flex items-center gap-1 text-sm text-brand-500 hover:text-brand-600">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentRequests && recentRequests.length > 0 ? (
              recentRequests.map((req) => (
                <ReportCard key={req.id} item={req as any} type="request" />
              ))
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-sm text-muted-foreground">No report requests yet</p>
                  <Link href="/new-report" className="mt-3">
                    <Button variant="outline" size="sm">Create your first report</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Activity Feed */}
        <ActivityFeed activities={recentActivity || []} />
      </div>
    </div>
  );
}
