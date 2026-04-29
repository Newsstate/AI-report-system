'use client';

import { Users, FileText, Zap, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/index';
import { cn } from '@/lib/utils';
import type { DashboardStats } from '@/types/database';

interface StatsCardsProps {
  stats: DashboardStats;
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Total Clients',
      value: stats.totalClients,
      icon: Users,
      color: 'text-brand-500',
      bg: 'bg-brand-500/10',
      change: null,
    },
    {
      title: 'Active Reports',
      value: stats.activeReports,
      icon: FileText,
      color: 'text-violet-500',
      bg: 'bg-violet-500/10',
      change: null,
    },
    {
      title: 'Pending Automations',
      value: stats.pendingAutomations,
      icon: Zap,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      pulse: stats.pendingAutomations > 0,
    },
    {
      title: 'Completed This Month',
      value: stats.completedThisMonth,
      icon: CheckCircle,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      change: null,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className="border-border/50">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                <p className="mt-2 text-3xl font-bold tabular-nums">{card.value}</p>
              </div>
              <div className={cn('rounded-xl p-2.5', card.bg)}>
                <card.icon
                  className={cn('h-5 w-5', card.color, (card as any).pulse && 'animate-pulse')}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
