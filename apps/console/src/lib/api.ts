import type {
  AgentDto,
  CreateAgentInput,
  CreateAgentVersionInput,
  CreateRunInput,
  RunDto,
} from '@agentinfra/shared-types';

const BASE = process.env.NEXT_PUBLIC_CONTROL_PLANE_URL ?? 'http://localhost:3001';
const API = `${BASE}/api`;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  listAgents: () => request<AgentDto[]>('/agents'),
  getAgent: (name: string) => request<AgentDto>(`/agents/${name}`),
  createAgent: (input: CreateAgentInput) =>
    request<AgentDto>('/agents', { method: 'POST', body: JSON.stringify(input) }),
  deleteAgent: (name: string) => request<void>(`/agents/${name}`, { method: 'DELETE' }),

  listVersions: (name: string) =>
    request<Array<{ id: string; version: string; image: string; createdAt: string }>>(
      `/agents/${name}/versions`,
    ),
  addVersion: (name: string, input: CreateAgentVersionInput) =>
    request<{ version: string }>(`/agents/${name}/versions`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  listRuns: (agentName: string) => request<RunDto[]>(`/agents/${agentName}/runs`),
  createRun: (agentName: string, input: CreateRunInput = {}) =>
    request<RunDto>(`/agents/${agentName}/runs`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  getRun: (id: string) => request<RunDto>(`/runs/${id}`),
  stopRun: (id: string) => request<RunDto>(`/runs/${id}/stop`, { method: 'POST' }),
};
