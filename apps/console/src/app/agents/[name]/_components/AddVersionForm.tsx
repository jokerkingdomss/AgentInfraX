'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export function AddVersionForm({ agentName }: { agentName: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [version, setVersion] = useState('0.1.0');
  const [image, setImage] = useState('alpine:3.20');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await api.addVersion(agentName, {
          version,
          image,
          entrypoint: [],
          env: {},
          resources: { cpu: '500m', memory: '512Mi' },
        });
        router.refresh();
      } catch (err) {
        setError((err as Error).message);
      }
    });
  };

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      <input
        value={version}
        onChange={(e) => setVersion(e.target.value)}
        placeholder="version (e.g. 0.1.0)"
        required
        style={inputStyle}
      />
      <input
        value={image}
        onChange={(e) => setImage(e.target.value)}
        placeholder="image (e.g. alpine:3.20)"
        required
        style={{ ...inputStyle, flex: 1, minWidth: 200 }}
      />
      <button type="submit" disabled={pending} style={btnStyle}>
        {pending ? 'adding…' : 'add version'}
      </button>
      {error && (
        <div style={{ width: '100%', color: '#ffb4b4', fontSize: '0.85rem' }}>{error}</div>
      )}
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  background: '#0b0d10',
  border: '1px solid #2a2f37',
  color: '#e6e6e6',
  padding: '0.5rem 0.75rem',
  borderRadius: 6,
  fontSize: '0.9rem',
};

const btnStyle: React.CSSProperties = {
  background: '#4f9cff',
  border: 'none',
  color: '#0b0d10',
  padding: '0.5rem 1.25rem',
  borderRadius: 6,
  fontWeight: 600,
  cursor: 'pointer',
};
