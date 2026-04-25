'use client';

import { useEffect, useRef, useState } from 'react';
import { subscribeRunLogs, RunLogEvent } from '@/lib/run-logs-socket';
import { FileText } from 'lucide-react';

const levelColor: Record<string, string> = {
  debug: 'var(--muted-foreground)',
  info: 'var(--status-success)',
  warn: 'var(--status-warning)',
  error: 'var(--status-danger)',
};

export function RunLogsPanel({ runId, initialLogs }: { runId: string; initialLogs: RunLogEvent[] }) {
  const [logs, setLogs] = useState<RunLogEvent[]>(initialLogs);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = subscribeRunLogs(runId, (log) => {
      setLogs((prev) => [...prev, log]);
    });
    return unsubscribe;
  }, [runId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs.length]);

  return (
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
          className="overflow-auto max-h-[480px] rounded-xl border border-[var(--border)] font-mono text-[13px]"
          style={{ boxShadow: 'var(--shadow-card)' }}
        >
          {logs.map((l, i) => (
            <div
              key={l.id}
              className={`flex items-center gap-3 border-t border-[var(--border)] px-4 py-1.5 ${
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
          <div ref={bottomRef} />
        </div>
      )}
    </section>
  );
}
