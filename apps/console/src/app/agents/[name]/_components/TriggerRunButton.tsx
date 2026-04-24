'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Loader2, Play } from 'lucide-react';

export function TriggerRunButton({
  agentName,
  versions,
  disabled,
}: {
  agentName: string;
  versions: Array<{ id: string; version: string }>;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selectedVersion, setSelectedVersion] = useState('');

  const onClick = () => {
    startTransition(async () => {
      try {
        await api.createRun(agentName, selectedVersion ? { version: selectedVersion } : {});
        toast('success', 'Run triggered');
        router.refresh();
        const poll = setInterval(() => router.refresh(), 1500);
        setTimeout(() => clearInterval(poll), 15000);
      } catch (err) {
        toast('error', (err as Error).message);
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      {versions.length > 1 && (
        <select
          value={selectedVersion}
          onChange={(e) => setSelectedVersion(e.target.value)}
          className="h-8 rounded-md border border-[var(--border)] bg-[var(--card)] px-2 text-xs text-[var(--foreground)] outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">Latest</option>
          {versions.map((v) => (
            <option key={v.id} value={v.version}>
              v{v.version}
            </option>
          ))}
        </select>
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
