import Link from 'next/link';
import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import { ArrowLeft } from 'lucide-react';
import { RunHeader } from './_components/RunHeader';
import { RunLogsPanel } from './_components/RunLogsPanel';

export const dynamic = 'force-dynamic';

export default async function RunDetailPage({ params, searchParams }: { params: { id: string }; searchParams: { from?: string } }) {
  const id = params.id;
  const from = searchParams.from;
  let run, logs;
  try {
    [run, logs] = await Promise.all([api.getRun(id), api.getRunLogs(id)]);
  } catch (err) {
    const msg = (err as Error).message;
    if (msg.includes('404')) notFound();
    throw err;
  }

  return (
    <div className="fade-in-up space-y-8">
      <div>
        <div className="flex items-center gap-3">
          {from === 'runs' && (
            <Link
              href="/runs"
              className="focus-ring press-scale inline-flex items-center gap-1.5 rounded-md px-2 py-1 -ml-2 text-[13px] text-[var(--muted-foreground)] transition-colors duration-200 hover:text-[var(--foreground)] hover:bg-[var(--accent)]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              All Runs
            </Link>
          )}
          <Link
            href={`/agents/${run.agentName}`}
            className="focus-ring press-scale inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[13px] text-[var(--muted-foreground)] transition-colors duration-200 hover:text-[var(--foreground)] hover:bg-[var(--accent)]"
          >
            {from !== 'runs' && <ArrowLeft className="h-3.5 w-3.5" />}
            {run.agentName}
          </Link>
        </div>

        <RunHeader runId={id} initialStatus={run.status} agentName={run.agentName} agentVersion={run.agentVersion} />
      </div>

      {/* Run metadata */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetaCard label="Container" value={run.containerId?.slice(0, 12) ?? '—'} mono />
        <MetaCard label="Started" value={run.startedAt ? new Date(run.startedAt).toLocaleString() : '—'} />
        <MetaCard label="Finished" value={run.finishedAt ? new Date(run.finishedAt).toLocaleString() : '—'} />
        <MetaCard label="Exit Code" value={run.exitCode !== null ? String(run.exitCode) : '—'} />
      </div>

      {/* Logs */}
      <RunLogsPanel runId={id} initialLogs={logs} />
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
