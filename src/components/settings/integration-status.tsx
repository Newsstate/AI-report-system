import { CheckCircle, XCircle, ExternalLink } from 'lucide-react';

interface IntegrationStatusProps {
  name: string;
  description: string;
  configured: boolean;
  url?: string;
}

export function IntegrationStatus({ name, description, configured, url }: IntegrationStatusProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/50 p-4">
      <div className="flex items-center gap-3">
        {configured ? (
          <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
        ) : (
          <XCircle className="h-5 w-5 text-muted-foreground shrink-0" />
        )}
        <div>
          <p className="text-sm font-medium">{name}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
          {url && configured && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground max-w-xs">
              {url.replace(/^https?:\/\//, '').slice(0, 40)}
            </p>
          )}
        </div>
      </div>
      <span className={`text-xs font-medium ${configured ? 'text-emerald-500' : 'text-muted-foreground'}`}>
        {configured ? 'Connected' : 'Not configured'}
      </span>
    </div>
  );
}
