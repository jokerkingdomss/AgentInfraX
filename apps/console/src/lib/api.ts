import type {
  AgentDto,
  CreateAgentInput,
  CreateAgentVersionInput,
  CreateRunInput,
  RunDto,
} from '@agentinfra/shared-types';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text();
    let msg = `${res.status} ${res.statusText}`;
    try {
      const json = JSON.parse(text);
      if (json.message) msg = json.message;
    } catch {}
    throw new Error(msg);
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
  listAllRuns: (limit = 50, offset = 0) =>
    request<{ items: RunDto[]; total: number }>(`/runs?limit=${limit}&offset=${offset}`),
  createRun: (agentName: string, input: CreateRunInput = {}) =>
    request<RunDto>(`/agents/${agentName}/runs`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  getRun: (id: string) => request<RunDto>(`/runs/${id}`),
  stopRun: (id: string) => request<RunDto>(`/runs/${id}/stop`, { method: 'POST' }),

  getRunLogs: (id: string) =>
    request<Array<{ id: string; runId: string; level: string; message: string; createdAt: string }>>(
      `/runs/${id}/logs`,
    ),
};
