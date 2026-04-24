'use client';

import { useEffect, useState } from 'react';
import { subscribe, getToasts } from '@/lib/toast';
import { X } from 'lucide-react';

type ToastItem = {
  id: number;
  message: string;
  type: 'error' | 'success' | 'info';
};

const typeStyles: Record<string, string> = {
  error: 'border-[var(--status-danger)]/20 bg-[var(--status-danger)]/5 text-[var(--status-danger)]',
  success: 'border-[var(--status-success)]/20 bg-[var(--status-success)]/5 text-[var(--status-success)]',
  info: 'border-[var(--status-neutral)]/20 bg-[var(--status-neutral)]/5 text-[var(--foreground)]',
};

const dotColors: Record<string, string> = {
  error: 'var(--status-danger)',
  success: 'var(--status-success)',
  info: 'var(--muted-foreground)',
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>(getToasts());

  useEffect(() => {
    return subscribe(setToasts);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`fade-in-up flex items-center gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg ${typeStyles[t.type]}`}
        >
          <span className="status-dot" style={{ color: dotColors[t.type] }} />
          <span className="flex-1">{t.message}</span>
        </div>
      ))}
    </div>
  );
}
