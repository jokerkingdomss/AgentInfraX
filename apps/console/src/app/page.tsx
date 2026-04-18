import Link from 'next/link';
import { api } from '@/lib/api';
import { CreateAgentForm } from './_components/CreateAgentForm';

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
    <main style={{ padding: '3rem', maxWidth: 960, margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', margin: 0 }}>AgentInfra</h1>
        <p style={{ opacity: 0.6, marginTop: '0.25rem' }}>M1a — agent CRUD + mock runner</p>
      </header>

      {error && (
        <div
          style={{
            background: '#3a1a1a',
            border: '1px solid #7a2a2a',
            color: '#ffb4b4',
            padding: '0.75rem 1rem',
            borderRadius: 6,
            marginBottom: '1.5rem',
          }}
        >
          control-plane unreachable: {error}
        </div>
      )}

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.1rem' }}>Create agent</h2>
        <CreateAgentForm />
      </section>

      <section>
        <h2 style={{ fontSize: '1.1rem' }}>Agents ({agents.length})</h2>
        {agents.length === 0 ? (
          <p style={{ opacity: 0.6 }}>No agents yet — create one above.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {agents.map((a) => (
              <li
                key={a.id}
                style={{
                  background: '#15181d',
                  padding: '1rem',
                  marginBottom: '0.5rem',
                  borderRadius: 6,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <Link
                    href={`/agents/${a.name}`}
                    style={{ color: '#4f9cff', fontWeight: 600, textDecoration: 'none' }}
                  >
                    {a.name}
                  </Link>
                  <div style={{ opacity: 0.6, fontSize: '0.85rem', marginTop: 2 }}>
                    {a.description ?? 'no description'} · latest:{' '}
                    {a.latestVersion ?? 'none'}
                  </div>
                </div>
                <code style={{ opacity: 0.4, fontSize: '0.75rem' }}>{a.id}</code>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
