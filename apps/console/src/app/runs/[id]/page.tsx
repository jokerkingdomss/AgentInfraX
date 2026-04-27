import Link from 'next/link';
import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import { ArrowLeft } from 'lucide-react';
import { RunHeader } from './_components/RunHeader';
import { RunMeta } from './_components/RunMeta';
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
      <RunMeta runId={id} initialRun={run} />

      {/* Logs */}
      <RunLogsPanel runId={id} initialLogs={logs} />
    </div>
  );
}
