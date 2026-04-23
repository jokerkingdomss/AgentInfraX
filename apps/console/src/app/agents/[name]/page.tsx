import type { ReactNode } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import { AddVersionForm } from './_components/AddVersionForm';
import { TriggerRunButton } from './_components/TriggerRunButton';
import { ArrowLeft, Box, Layers, Play } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AgentDetail({ params }: { params: { name: string } }) {
  const name = params.name;
  let agent, versions, runs;
  try {
    [agent, versions, runs] = await Promise.all([
      api.getAgent(name),
      api.listVersions(name),
      api.listRuns(name),
    ]);
  } catch (err) {
    const msg = (err as Error).message;
    if (msg.includes('404')) notFound();
    throw err;
  }

  return (
    <div className="fade-in-up space-y-10">
      {/* ── BREADCRUMB ── */}
      <div>
        <Link
          href="/"
          className="focus-ring press-scale inline-flex items-center gap-1.5 rounded-md px-2 py-1 -ml-2 text-[13px] text-[var(--muted-foreground)] transition-colors duration-200 hover:text-[var(--foreground)] hover:bg-[var(--accent)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Agents
        </Link>

        {/* ── HEADER ── */}
        <div className="mt-3 flex items-start justify-between">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight">{agent.name}</h1>
            <p className="mt-1 text-[13px] text-[var(--muted-foreground)]">
              {agent.description ?? 'No description'}
            </p>
          </div>
          <span className="font-mono text-[11px] text-[var(--muted-foreground)]" style={{ opacity: 0.5 }}>
            {agent.id.slice(0, 12)}
          </span>
        </div>
      </div>

      {/* ── STATS ── */}
      <div className="grid grid-cols-3 gap-4">
        <MiniStat icon={<Layers className="h-4 w-4" />} label="Versions" value={versions.length} />
        <MiniStat icon={<Play className="h-4 w-4" />} label="Runs" value={runs.length} />
        <MiniStat icon={<Box className="h-4 w-4" />} label="Runtime" value="Mock" />
      </div>

      {/* ── VERSIONS ── */}
      <section>
        <h2 className="mb-4 text-[13px] font-medium text-[var(--muted-foreground)]">Versions</h2>

        {versions.length === 0 ? (
          <div className="flex items-center justify-center rounded-xl border border-dashed border-[var(--border)] py-10">
            <p className="text-sm text-[var(--muted-foreground)]">No versions yet — add one below.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[var(--border)]" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="grid grid-cols-[1fr_2fr_1fr] gap-4 bg-[var(--secondary)] px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
              <span>Version</span>
              <span>Image</span>
              <span className="text-right">Created</span>
            </div>
            {versions.map((v) => (
              <div
                key={v.id}
                className="hover-row grid grid-cols-[1fr_2fr_1fr] gap-4 border-t border-[var(--border)] px-4 py-3 text-sm transition-colors duration-200"
              >
                <span className="font-medium">v{v.version}</span>
                <span className="font-mono text-xs text-[var(--muted-foreground)]">{v.image}</span>
                <span className="text-right text-xs text-[var(--muted-foreground)]">
                  {new Date(v.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5" style={{ boxShadow: 'var(--shadow-card)' }}>
          <h3 className="mb-3 text-[11px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">Add Version</h3>
          <AddVersionForm agentName={agent.name} />
        </div>
      </section>

      {/* ── RUNS ── */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[13px] font-medium text-[var(--muted-foreground)]">Runs</h2>
          <TriggerRunButton agentName={agent.name} disabled={versions.length === 0} />
        </div>

        {runs.length === 0 ? (
          <div className="flex items-center justify-center rounded-xl border border-dashed border-[var(--border)] py-10">
            <p className="text-sm text-[var(--muted-foreground)]">No runs yet — trigger one above.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[var(--border)]" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="grid grid-cols-[120px_100px_80px_1fr] gap-4 bg-[var(--secondary)] px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
              <span>Status</span>
              <span>ID</span>
              <span>Version</span>
              <span className="text-right">Created</span>
            </div>
            {runs.map((r) => (
              <div
                key={r.id}
                className="hover-row grid grid-cols-[120px_100px_80px_1fr] gap-4 border-t border-[var(--border)] px-4 py-3 text-sm transition-colors duration-200"
              >
                <span className="flex items-center gap-2">
                  <StatusIndicator status={r.status} />
                  <span className="text-xs font-medium capitalize">{r.status}</span>
                </span>
                <span className="font-mono text-xs">{r.id.slice(0, 8)}</span>
                <span className="text-xs text-[var(--muted-foreground)]">v{r.agentVersion}</span>
                <span className="text-right text-xs text-[var(--muted-foreground)]">
                  {new Date(r.createdAt).toLocaleString()}
                  {r.exitCode !== null ? ` · exit ${r.exitCode}` : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatusIndicator({ status }: { status: string }) {
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

function MiniStat({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--muted)] text-[var(--muted-foreground)]">
        {icon}
      </div>
      <div>
        <div className="text-[11px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">{label}</div>
        <div className="mt-0.5 text-lg font-semibold tabular-nums">{value}</div>
      </div>
    </div>
  );
}

