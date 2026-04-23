'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

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
    <form onSubmit={onSubmit}>
      <div className="grid grid-cols-[180px_1fr_auto] items-end gap-3">
        <div>
          <Label htmlFor="name" className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
            Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="my-agent"
            required
            aria-required="true"
            className="bg-[var(--background)] font-mono text-sm"
          />
        </div>
        <div>
          <Label htmlFor="desc" className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">
            Description
          </Label>
          <Input
            id="desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this agent do? (optional)"
            className="bg-[var(--background)] text-sm"
          />
        </div>
        <Button type="submit" disabled={pending} className="press-scale h-9 min-w-[80px] px-4 text-sm">
          {pending ? (
            <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Creating…</>
          ) : 'Create'}
        </Button>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-xs text-destructive">{error}</p>
      )}
    </form>
  );
}
