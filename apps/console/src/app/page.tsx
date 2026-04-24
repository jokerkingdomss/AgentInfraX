import Link from 'next/link';
import { api } from '@/lib/api';
import { CreateAgentForm } from './_components/CreateAgentForm';
import { Bot, ChevronRight, Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function loadAgents() {
  try {
    return { agents: await api.listAgents(), error: null as string | null };
  } catch (err) {
    return { agents: [], error: (err as Error).message };
  }
}

export default async function AgentsPage() {
  const { agents, error } = await loadAgents();

  return (
    <div className="fade-in-up space-y-10">
      {/* ── HEADER ── */}
      <header>
        <h1 className="text-[22px] font-semibold tracking-tight">Agents</h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--muted-foreground)]">
          Manage your compute agents — create, version, and trigger runs.
        </p>
      </header>

      {/* ── ERROR ── */}
      {error && (
        <div role="alert" className="flex items-center gap-3 rounded-lg border border-[var(--status-danger)]/20 bg-[var(--status-danger)]/5 px-4 py-3 text-sm text-[var(--status-danger)]">
          <div className="status-dot" style={{ color: 'var(--status-danger)' }} />
          <span>Control plane unreachable — {error}</span>
        </div>
      )}

      {/* ── STATS ── */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Agents" value={agents.length} />
        <StatCard label="Runtime" value={process.env.NEXT_PUBLIC_RUNTIME_DRIVER ?? 'docker'} />
        <StatCard label="Status" value={error ? 'Offline' : 'Online'} dotColor={error ? 'var(--status-danger)' : 'var(--status-success)'} />
      </div>

      {/* ── CREATE AGENT ── */}
      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="mb-5 flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Plus className="h-4 w-4" />
          </div>
          <h2 className="text-sm font-medium">New Agent</h2>
        </div>
        <CreateAgentForm />
      </section>

      {/* ── AGENT LIST ── */}
      <section>
        <h2 className="mb-4 text-[13px] font-medium text-[var(--muted-foreground)]">
          All Agents · {agents.length}
        </h2>

        {agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] py-16">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--muted)]">
              <Bot className="h-6 w-6 text-[var(--muted-foreground)]" />
            </div>
            <p className="text-sm font-medium text-[var(--muted-foreground)]">No agents yet</p>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]" style={{ opacity: 0.6 }}>
              Create your first agent above to get started.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {agents.map((a, i) => (
              <Link
                key={a.id}
                href={`/agents/${a.name}`}
                className="hover-card press-scale focus-ring group flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 transition-all duration-200"
                style={{ boxShadow: 'var(--shadow-card)', animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/8 text-primary">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-sm font-medium transition-colors duration-200 group-hover:text-primary">
                      {a.name}
                    </span>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                      <span>{a.description || 'No description'}</span>
                      {a.latestVersion && (
                        <span className="rounded bg-[var(--muted)] px-1.5 py-0.5 font-mono text-[10px]">
                          v{a.latestVersion}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[11px] text-[var(--muted-foreground)]" style={{ opacity: 0.5 }}>
                    {a.id.slice(0, 8)}
                  </span>
                  <ChevronRight className="h-4 w-4 text-[var(--muted-foreground)] opacity-30 transition-all duration-200 group-hover:opacity-100 group-hover:text-primary" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value, dotColor }: { label: string; value: string | number; dotColor?: string }) {
  return (
    <div
      className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      <div className="text-[11px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">{label}</div>
      <div className="mt-2 flex items-center gap-2 text-2xl font-semibold tabular-nums tracking-tight">
        {dotColor && <span className="status-dot" style={{ color: dotColor }} />}
        {value}
      </div>
    </div>
  );
}
