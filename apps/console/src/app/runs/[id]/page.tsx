import Link from 'next/link';
import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import { ArrowLeft, FileText, Play } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function RunDetailPage({ params }: { params: { id: string } }) {
  const id = params.id;
  let run, logs;
  try {
    [run, logs] = await Promise.all([api.getRun(id), api.getRunLogs(id)]);
  } catch (err) {
    const msg = (err as Error).message;
    if (msg.includes('404')) notFound();
    throw err;
  }

  const levelColor: Record<string, string> = {
    debug: 'var(--muted-foreground)',
    info: 'var(--status-success)',
    warn: 'var(--status-warning)',
    error: 'var(--status-danger)',
  };

  return (
    <div className="fade-in-up space-y-8">
      <div>
        <Link
          href={`/agents/${run.agentName}`}
          className="focus-ring press-scale inline-flex items-center gap-1.5 rounded-md px-2 py-1 -ml-2 text-[13px] text-[var(--muted-foreground)] transition-colors duration-200 hover:text-[var(--foreground)] hover:bg-[var(--accent)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {run.agentName}
        </Link>

        <div className="mt-3 flex items-start justify-between">
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight">
              Run <span className="font-mono text-base">{id.slice(0, 8)}</span>
            </h1>
            <div className="mt-1 flex items-center gap-3 text-[13px] text-[var(--muted-foreground)]">
              <span className="flex items-center gap-1.5">
                <StatusDot status={run.status} />
                <span className="capitalize">{run.status}</span>
              </span>
              <span>Agent: {run.agentName}</span>
              <span>v{run.agentVersion}</span>
            </div>
          </div>
          {run.status === 'running' && (
            <form
              action={async () => {
                'use server';
                await api.stopRun(id);
              }}
            >
              <button
                type="submit"
                className="focus-ring press-scale rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-xs font-medium transition-colors duration-200 hover:bg-[var(--accent)]"
              >
                Stop
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Run metadata */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetaCard label="Container" value={run.containerId?.slice(0, 12) ?? '—'} mono />
        <MetaCard label="Started" value={run.startedAt ? new Date(run.startedAt).toLocaleString() : '—'} />
        <MetaCard label="Finished" value={run.finishedAt ? new Date(run.finishedAt).toLocaleString() : '—'} />
        <MetaCard label="Exit Code" value={run.exitCode !== null ? String(run.exitCode) : '—'} />
      </div>

      {/* Logs */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4 text-[var(--muted-foreground)]" />
          <h2 className="text-[13px] font-medium text-[var(--muted-foreground)]">
            Logs · {logs.length}
          </h2>
        </div>

        {logs.length === 0 ? (
          <div className="flex items-center justify-center rounded-xl border border-dashed border-[var(--border)] py-12">
            <p className="text-sm text-[var(--muted-foreground)]">No logs yet</p>
          </div>
        ) : (
          <div
            className="overflow-hidden rounded-xl border border-[var(--border)] font-mono text-[13px]"
            style={{ boxShadow: 'var(--shadow-card)' }}
          >
            {logs.map((l, i) => (
              <div
                key={l.id}
                className={`flex gap-3 border-t border-[var(--border)] px-4 py-1.5 ${
                  i === 0 ? 'border-t-0' : ''
                }`}
              >
                <span className="shrink-0 text-[11px] text-[var(--muted-foreground)]" style={{ opacity: 0.6 }}>
                  {new Date(l.createdAt).toLocaleTimeString()}
                </span>
                <span
                  className="shrink-0 w-12 text-right text-[11px] font-semibold uppercase"
                  style={{ color: levelColor[l.level] ?? 'var(--muted-foreground)' }}
                >
                  {l.level}
                </span>
                <span className="whitespace-pre-wrap break-all">{l.message}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

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
