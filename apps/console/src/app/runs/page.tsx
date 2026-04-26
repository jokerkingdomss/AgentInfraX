'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { RunDto, RunStatus } from '@agentinfra/shared-types';
import { api } from '@/lib/api';
import { subscribeRunStatus } from '@/lib/run-logs-socket';

const PAGE_SIZE = 50;

const STATUS_COLORS: Record<string, string> = {
  pending: 'var(--status-neutral)',
  starting: 'var(--status-warning)',
  running: 'var(--status-warning)',
  succeeded: 'var(--status-success)',
  failed: 'var(--status-danger)',
  stopped: 'var(--status-neutral)',
};

const ALL_TABS = ['all', 'running', 'succeeded', 'failed', 'stopped'] as const;
type Tab = (typeof ALL_TABS)[number];

function StatusDot({ status }: { status: string }) {
  const pulse = status === 'running' || status === 'starting';
  return (
    <span
      className={`status-dot ${pulse ? 'status-dot-pulse' : ''}`}
      style={{ color: STATUS_COLORS[status] ?? 'var(--status-neutral)' }}
    />
  );
}

function formatDuration(start: string | null, end: string | null): string {
  if (!start) return '—';
  const s = new Date(start).getTime();
  const e = end ? new Date(end).getTime() : Date.now();
  const sec = Math.floor((e - s) / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const rem = sec % 60;
  return `${min}m ${rem}s`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString();
}

export default function RunsPage() {
  const [tab, setTab] = useState<Tab>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [runs, setRuns] = useState<RunDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPage(1);
  }, [tab]);

  useEffect(() => {
    setLoading(true);
    const offset = (page - 1) * PAGE_SIZE;
    api.listAllRuns(PAGE_SIZE, offset).then((res) => {
      let items = res.items;
      if (tab !== 'all') {
        items = items.filter((r) => r.status === tab);
      }
      setRuns(items);
      setTotal(res.total);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [page, tab]);

  // Subscribe to status updates for running runs
  useEffect(() => {
    const unsubs: (() => void)[] = [];
    for (const r of runs) {
      if (r.status === 'running' || r.status === 'starting' || r.status === 'pending') {
        unsubs.push(
          subscribeRunStatus(r.id, (newStatus) => {
            setRuns((prev) =>
              prev.map((run) => (run.id === r.id ? { ...run, status: newStatus as RunStatus } : run)),
            );
          }),
        );
      }
    }
    return () => unsubs.forEach((u) => u());
  }, [runs]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="fade-in-up space-y-6">
      <header>
        <h1 className="text-[22px] font-semibold tracking-tight">Runs</h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--muted-foreground)]">
          All run executions across agents.
        </p>
      </header>

      {/* Status filter tabs */}
      <div className="flex gap-1 rounded-lg border border-[var(--border)] bg-[var(--card)] p-1">
        {ALL_TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`focus-ring rounded-md px-3 py-1.5 text-xs font-medium capitalize transition-colors duration-200 ${
              tab === t
                ? 'bg-[var(--accent)] text-[var(--foreground)]'
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-sm text-[var(--muted-foreground)]">
          Loading…
        </div>
      ) : runs.length === 0 ? (
        <div className="flex items-center justify-center rounded-xl border border-dashed border-[var(--border)] py-10">
          <p className="text-sm text-[var(--muted-foreground)]">No runs found.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--border)]" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="grid grid-cols-[1fr_80px_80px_60px_1fr_80px] gap-4 border-b border-[var(--border)] bg-[var(--accent)] px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
            <span>Agent</span>
            <span>Version</span>
            <span>Status</span>
            <span>Exit</span>
            <span>Created</span>
            <span className="text-right">Duration</span>
          </div>
          {runs.map((r) => (
            <Link
              key={r.id}
              href={`/runs/${r.id}?from=runs`}
              className="hover-row grid grid-cols-[1fr_80px_80px_60px_1fr_80px] gap-4 border-t border-[var(--border)] px-4 py-3 text-sm transition-colors duration-200"
            >
              <span className="font-medium">{r.agentName}</span>
              <span className="text-[var(--muted-foreground)]">v{r.agentVersion}</span>
              <span className="flex items-center gap-1.5">
                <StatusDot status={r.status} />
                <span className="capitalize">{r.status}</span>
              </span>
              <span className="font-mono text-[var(--muted-foreground)]">
                {r.exitCode !== null ? r.exitCode : '—'}
              </span>
              <span className="text-[var(--muted-foreground)]">{formatTime(r.createdAt)}</span>
              <span className="text-right text-[var(--muted-foreground)]">
                {formatDuration(r.startedAt, r.finishedAt)}
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-[13px] text-[var(--muted-foreground)]">
          <span>
            Page {page} of {totalPages} ({total} runs)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="focus-ring press-scale rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-xs font-medium transition-colors duration-200 hover:bg-[var(--accent)] disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="focus-ring press-scale rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-xs font-medium transition-colors duration-200 hover:bg-[var(--accent)] disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
