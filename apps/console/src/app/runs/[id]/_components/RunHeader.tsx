'use client';

import { useEffect, useState, useTransition } from 'react';
import { api } from '@/lib/api';
import { subscribeRunStatus } from '@/lib/run-logs-socket';
import { toast } from '@/lib/toast';

function StatusDot({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    pending: 'var(--status-neutral)',
    starting: 'var(--status-warning)',
    running: 'var(--status-warning)',
    succeeded: 'var(--status-success)',
    failed: 'var(--status-danger)',
    stopped: 'var(--status-neutral)',
  };
  const pulse = status === 'running' || status === 'starting';
  return (
    <span
      className={`status-dot ${pulse ? 'status-dot-pulse' : ''}`}
      style={{ color: colorMap[status] ?? 'var(--status-neutral)' }}
    />
  );
}

export function RunHeader({ runId, initialStatus, agentName, agentVersion }: { runId: string; initialStatus: string; agentName: string; agentVersion: string }) {
  const [status, setStatus] = useState(initialStatus);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const unsub = subscribeRunStatus(runId, (s) => setStatus(s));
    return unsub;
  }, [runId]);

  const handleStop = () => {
    startTransition(async () => {
      try {
        await api.stopRun(runId);
      } catch (err) {
        toast('error', (err as Error).message);
      }
    });
  };

  return (
    <div className="mt-3 flex items-start justify-between">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">
          Run <span className="font-mono text-base">{runId.slice(0, 8)}</span>
        </h1>
        <div className="mt-1 flex items-center gap-3 text-[13px] text-[var(--muted-foreground)]">
          <span className="flex items-center gap-1.5">
            <StatusDot status={status} />
            <span className="capitalize">{status}</span>
          </span>
          <span>Agent: {agentName}</span>
          <span>v{agentVersion}</span>
        </div>
      </div>
      {(status === 'running' || status === 'starting' || status === 'pending') && (
        <button
          onClick={handleStop}
          disabled={pending}
          className="focus-ring press-scale rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-xs font-medium transition-colors duration-200 hover:bg-[var(--accent)] disabled:opacity-50"
        >
          {pending ? 'Stopping…' : 'Stop'}
        </button>
      )}
    </div>
  );
}
