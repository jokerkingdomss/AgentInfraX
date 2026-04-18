import { z } from 'zod';

/**
 * Agent manifest — the user-facing definition of an agent.
 * Kept minimal for M0; will grow in M1+.
 */
export const AgentManifestSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9][a-z0-9-]*$/, 'lowercase, digits, and hyphens only'),
  version: z.string().default('0.0.1'),
  image: z.string().min(1),
  entrypoint: z.array(z.string()).default([]),
  env: z.record(z.string()).default({}),
  resources: z
    .object({
      cpu: z.string().default('500m'),
      memory: z.string().default('512Mi'),
    })
    .default({ cpu: '500m', memory: '512Mi' }),
});

export type AgentManifest = z.infer<typeof AgentManifestSchema>;

export type AgentStatus = 'pending' | 'running' | 'stopped' | 'failed';

export interface AgentRun {
  id: string;
  agentName: string;
  status: AgentStatus;
  containerId?: string;
  startedAt: string;
  finishedAt?: string;
  exitCode?: number;
}
