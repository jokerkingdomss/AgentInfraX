'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

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
    <form onSubmit={onSubmit} className="flex items-end gap-3">
      <div className="flex-shrink-0">
        <Label htmlFor="version" className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">Version <span className="text-destructive">*</span></Label>
        <Input
          id="version"
          value={version}
          onChange={(e) => setVersion(e.target.value)}
          placeholder="0.1.0"
          required
          aria-required="true"
          className="w-32 bg-[var(--background)] font-mono text-sm"
        />
      </div>
      <div className="flex-1">
        <Label htmlFor="image" className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-[var(--muted-foreground)]">Image <span className="text-destructive">*</span></Label>
        <Input
          id="image"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          placeholder="alpine:3.20"
          required
          aria-required="true"
          className="bg-[var(--background)] font-mono text-sm"
        />
      </div>
      <Button type="submit" disabled={pending} size="sm" className="press-scale min-w-[64px]">
        {pending ? (
          <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />Adding…</>
        ) : 'Add'}
      </Button>
      {error && (
        <span role="alert" className="text-xs text-destructive whitespace-nowrap">{error}</span>
      )}
    </form>
  );
}
