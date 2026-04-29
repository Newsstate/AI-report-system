'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ExternalLink, MoreVertical, Edit, Trash2, Globe, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/index';
import { Button } from '@/components/ui/button';
import { getInitials } from '@/lib/utils';
import type { Client } from '@/types/database';

interface ClientCardProps {
  client: Client;
  reportCount?: number;
  onDelete?: (id: string) => void;
}

export function ClientCard({ client, reportCount = 0, onDelete }: ClientCardProps) {
  return (
    <Card className="group overflow-hidden border-border/50 transition-all hover:border-border">
      {/* Brand color bar */}
      <div
        className="h-1.5 w-full"
        style={{ backgroundColor: client.brand_color || '#6272f6' }}
      />

      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Logo / Avatar */}
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm"
            style={{
              backgroundColor: client.logo_url ? 'transparent' : (client.brand_color || '#6272f6'),
            }}
          >
            {client.logo_url ? (
              <Image
                src={client.logo_url}
                alt={client.name}
                width={48}
                height={48}
                className="h-12 w-12 rounded-xl object-cover"
              />
            ) : (
              getInitials(client.name)
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="truncate font-semibold">{client.name}</h3>
              {onDelete && (
                <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Link href={`/clients/${client.id}/edit`}>
                    <Button variant="ghost" size="icon-sm">
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground hover:text-rose-500"
                    onClick={() => onDelete(client.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>

            {client.industry && (
              <p className="text-xs text-muted-foreground">{client.industry}</p>
            )}

            <div className="mt-3 space-y-1">
              {client.website && (
                <a
                  href={client.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-brand-500"
                >
                  <Globe className="h-3 w-3" />
                  <span className="truncate">{client.website.replace(/^https?:\/\//, '')}</span>
                  <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                </a>
              )}
              {client.location && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {client.location}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-4">
          <span className="text-xs text-muted-foreground">
            {reportCount} {reportCount === 1 ? 'report' : 'reports'}
          </span>
          <div className="flex items-center gap-2">
            <span
              className="inline-flex h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: client.is_active ? '#10b981' : '#94a3b8' }}
            />
            <span className="text-xs text-muted-foreground">
              {client.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
