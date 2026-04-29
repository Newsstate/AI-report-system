'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function RetryButton({ reportRequestId }: { reportRequestId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleRetry() {
    setLoading(true);
    try {
      const res = await fetch('/api/automation/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportRequestId }),
      });
      if (res.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" size="sm" loading={loading} onClick={handleRetry}>
      <RefreshCw className="mr-2 h-3.5 w-3.5" />
      Retry Automation
    </Button>
  );
}
