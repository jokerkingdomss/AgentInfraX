'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Loader2, Play } from 'lucide-react';

export function TriggerRunButton({
  agentName,
  disabled,
}: {
  agentName: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onClick = () => {
    setError(null);
    startTransition(async () => {
      try {
        await api.createRun(agentName, {});
        router.refresh();
        // Keep refreshing while run progresses.
        const poll = setInterval(() => router.refresh(), 1500);
        setTimeout(() => clearInterval(poll), 15000);
      } catch (err) {
        setError((err as Error).message);
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      {error && (
        <span role="alert" className="text-xs text-destructive">{error}</span>
      )}
      <Button
        onClick={onClick}
        disabled={pending || disabled}
        size="sm"
        title={disabled ? 'Add a version first' : ''}
        className="press-scale min-w-[110px]"
      >
        {pending ? (
          <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Running…</>
        ) : (
          <><Play className="mr-1.5 h-3.5 w-3.5" />Trigger Run</>
        )}
      </Button>
    </div>
  );
}
