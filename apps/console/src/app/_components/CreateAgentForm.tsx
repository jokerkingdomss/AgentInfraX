'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export function CreateAgentForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await api.createAgent({ name, description: description || undefined });
        setName('');
        setDescription('');
        router.refresh();
      } catch (err) {
        setError((err as Error).message);
      }
    });
  };

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="agent-name (lowercase, hyphens)"
        required
        style={inputStyle}
      />
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="description (optional)"
        style={{ ...inputStyle, flex: 1, minWidth: 200 }}
      />
      <button type="submit" disabled={pending} style={btnStyle}>
        {pending ? 'creating…' : 'create'}
      </button>
      {error && (
        <div style={{ width: '100%', color: '#ffb4b4', fontSize: '0.85rem' }}>{error}</div>
      )}
    </form>
  );
}

const inputStyle: React.CSSProperties = {
  background: '#15181d',
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
