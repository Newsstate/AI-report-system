'use client';

import { formatRelativeTime } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/index';
import type { ActivityFeedItem } from '@/types/database';
import { FileText, Users, Zap, Settings } from 'lucide-react';

interface ActivityFeedProps {
  activities: ActivityFeedItem[];
}

const entityIcons = {
  client: Users,
  report: FileText,
  report_request: Zap,
  team: Settings,
};

export function ActivityFeed({ activities }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <Zap className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No recent activity</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/50">
          {activities.map((activity, index) => {
            const Icon = entityIcons[activity.entity_type] || Zap;
            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 px-6 py-4 transition-colors hover:bg-muted/30"
              >
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{activity.action}</p>
                  {activity.description && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {activity.description}
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatRelativeTime(activity.created_at)}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
