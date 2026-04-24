type ToastItem = {
  id: number;
  message: string;
  type: 'error' | 'success' | 'info';
};

let nextId = 0;
const listeners = new Set<(toasts: ToastItem[]) => void>();
let toasts: ToastItem[] = [];

function emit() {
  listeners.forEach((l) => l([...toasts]));
}

export function toast(type: ToastItem['type'], message: string) {
  const id = nextId++;
  toasts = [...toasts, { id, message, type }];
  emit();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  }, 4000);
}

export function subscribe(listener: (toasts: ToastItem[]) => void): () => void {
  listeners.add(listener);
  const unsubscribe = () => { listeners.delete(listener); };
  return unsubscribe;
}

export function getToasts() {
  return toasts;
}
