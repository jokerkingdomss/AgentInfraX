'use client';

import { io, Socket } from 'socket.io-client';

export interface RunLogEvent {
  id: string;
  runId: string;
  level: string;
  message: string;
  createdAt: string;
}

let socket: Socket | null = null;

function getSocket(): Socket {
  if (!socket) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';
    const base = apiUrl.replace(/\/api$/, '');
    socket = io(`${base}/runs`, { transports: ['websocket'] });
  }
  return socket;
}

export function subscribeRunLogs(
  runId: string,
  onLog: (log: RunLogEvent) => void,
): () => void {
  const s = getSocket();
  s.emit('join-run', runId);
  const handler = (log: RunLogEvent) => {
    if (log.runId === runId) onLog(log);
  };
  s.on('run-log-appended', handler);
  return () => {
    s.off('run-log-appended', handler);
    s.emit('leave-run', runId);
  };
}

export function subscribeRunStatus(
  runId: string,
  onStatus: (status: string) => void,
): () => void {
  const s = getSocket();
  s.emit('join-run', runId);
  const handler = (data: { runId: string; status: string }) => {
    if (data.runId === runId) onStatus(data.status);
  };
  s.on('run-status-updated', handler);
  return () => {
    s.off('run-status-updated', handler);
    s.emit('leave-run', runId);
  };
}
