import Link from 'next/link';
import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import { AddVersionForm } from './_components/AddVersionForm';
import { TriggerRunButton } from './_components/TriggerRunButton';

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
    <main style={{ padding: '3rem', maxWidth: 960, margin: '0 auto' }}>
      <Link href="/" style={{ opacity: 0.6, fontSize: '0.85rem' }}>
        ← back to agents
      </Link>
      <header style={{ margin: '1rem 0 2rem' }}>
        <h1 style={{ fontSize: '1.6rem', margin: 0 }}>{agent.name}</h1>
        <p style={{ opacity: 0.6, marginTop: 4 }}>{agent.description ?? 'no description'}</p>
      </header>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.05rem' }}>Versions ({versions.length})</h2>
        {versions.length === 0 ? (
          <p style={{ opacity: 0.6 }}>No versions yet. Add one below.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {versions.map((v) => (
              <li key={v.id} style={cardStyle}>
                <div>
                  <strong>v{v.version}</strong>{' '}
                  <code style={{ opacity: 0.6, fontSize: '0.85rem' }}>{v.image}</code>
                </div>
                <div style={{ opacity: 0.5, fontSize: '0.8rem' }}>
                  {new Date(v.createdAt).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        )}
        <div style={{ marginTop: '1rem' }}>
          <h3 style={{ fontSize: '0.95rem', opacity: 0.8 }}>Add version</h3>
          <AddVersionForm agentName={agent.name} />
        </div>
      </section>

      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.05rem' }}>Runs ({runs.length})</h2>
          <TriggerRunButton agentName={agent.name} disabled={versions.length === 0} />
        </div>
        {runs.length === 0 ? (
          <p style={{ opacity: 0.6 }}>No runs yet.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {runs.map((r) => (
              <li key={r.id} style={cardStyle}>
                <div>
                  <StatusPill status={r.status} />{' '}
                  <code style={{ opacity: 0.8, fontSize: '0.85rem' }}>{r.id.slice(0, 8)}</code>{' '}
                  <span style={{ opacity: 0.5, fontSize: '0.8rem' }}>v{r.agentVersion}</span>
                </div>
                <div style={{ opacity: 0.5, fontSize: '0.8rem' }}>
                  {new Date(r.createdAt).toLocaleString()}
                  {r.exitCode !== null ? ` · exit ${r.exitCode}` : ''}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function StatusPill({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pending: '#888',
    starting: '#d7a84a',
    running: '#4f9cff',
    succeeded: '#4ac96b',
    failed: '#e05656',
    stopped: '#888',
  };
  return (
    <span
      style={{
        background: colors[status] ?? '#666',
        color: '#0b0d10',
        padding: '2px 8px',
        borderRadius: 10,
        fontSize: '0.75rem',
        fontWeight: 600,
        textTransform: 'uppercase',
      }}
    >
      {status}
    </span>
  );
}

const cardStyle: React.CSSProperties = {
  background: '#15181d',
  padding: '0.75rem 1rem',
  marginBottom: '0.5rem',
  borderRadius: 6,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};
