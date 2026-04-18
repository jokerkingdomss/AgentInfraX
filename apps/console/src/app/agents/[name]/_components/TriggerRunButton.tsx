'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export function TriggerRunButton({
  agentName,
  disabled,
}: {
  agentName: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onClick = () => {
    setError(null);
    startTransition(async () => {
      try {
        await api.createRun(agentName, {});
        router.refresh();
        // Keep refreshing while run progresses.
        const poll = setInterval(() => router.refresh(), 1500);
        setTimeout(() => clearInterval(poll), 15000);
      } catch (err) {
        setError((err as Error).message);
      }
    });
  };

  return (
    <div>
      <button onClick={onClick} disabled={pending || disabled} style={btnStyle} title={disabled ? 'add a version first' : ''}>
        {pending ? 'triggering…' : 'trigger run'}
      </button>
      {error && (
        <div style={{ color: '#ffb4b4', fontSize: '0.8rem', marginTop: 4 }}>{error}</div>
      )}
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  background: '#4ac96b',
  border: 'none',
  color: '#0b0d10',
  padding: '0.5rem 1.25rem',
  borderRadius: 6,
  fontWeight: 600,
  cursor: 'pointer',
};
