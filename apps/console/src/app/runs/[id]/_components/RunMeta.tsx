'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { RunDto } from '@agentinfra/shared-types';
import { subscribeRunStatus } from '@/lib/run-logs-socket';

export function RunMeta({ runId, initialRun }: { runId: string; initialRun: RunDto }) {
  const [run, setRun] = useState(initialRun);

  useEffect(() => {
    const unsub = subscribeRunStatus(runId, async (status) => {
      // On terminal status, refetch full run data to get finishedAt/exitCode
      const terminal = ['succeeded', 'failed', 'stopped'];
      if (terminal.includes(status)) {
        try {
          const updated = await api.getRun(runId);
          setRun(updated);
        } catch {}
      }
    });
    return unsub;
  }, [runId]);

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <MetaCard label="Container" value={run.containerId?.slice(0, 12) ?? '—'} mono />
      <MetaCard label="Started" value={run.startedAt ? new Date(run.startedAt).toLocaleString() : '—'} />
      <MetaCard label="Finished" value={run.finishedAt ? new Date(run.finishedAt).toLocaleString() : '—'} />
      <MetaCard label="Exit Code" value={run.exitCode !== null ? String(run.exitCode) : '—'} />
    </div>
  );
}

function MetaCard({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div
      className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      <div className="text-[11px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">{label}</div>
      <div className={`mt-1 text-sm font-medium ${mono ? 'font-mono' : ''}`}>{value}</div>
    </div>
  );
}
