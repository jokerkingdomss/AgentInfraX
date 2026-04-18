async function fetchHealth() {
  const url = process.env.NEXT_PUBLIC_CONTROL_PLANE_URL ?? 'http://localhost:3001';
  try {
    const res = await fetch(`${url}/health`, { cache: 'no-store' });
    if (!res.ok) return { status: 'unreachable', code: res.status };
    return await res.json();
  } catch (err) {
    return { status: 'unreachable', error: (err as Error).message };
  }
}

export default async function HomePage() {
  const health = await fetchHealth();
  return (
    <main style={{ padding: '4rem', maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>AgentInfra</h1>
      <p style={{ opacity: 0.7, marginBottom: '2rem' }}>
        Self-hostable agent infra — M0 scaffolding
      </p>

      <section>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Control plane health</h2>
        <pre
          style={{
            background: '#15181d',
            padding: '1rem',
            borderRadius: 8,
            overflow: 'auto',
          }}
        >
          {JSON.stringify(health, null, 2)}
        </pre>
      </section>
    </main>
  );
}
