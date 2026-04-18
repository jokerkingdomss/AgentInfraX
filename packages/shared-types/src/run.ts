import { z } from 'zod';

export const RunStatusSchema = z.enum(['pending', 'starting', 'running', 'succeeded', 'failed', 'stopped']);
export type RunStatus = z.infer<typeof RunStatusSchema>;

export const RunDtoSchema = z.object({
  id: z.string(),
  agentName: z.string(),
  agentVersion: z.string(),
  status: RunStatusSchema,
  containerId: z.string().nullable(),
  startedAt: z.string().nullable(),
  finishedAt: z.string().nullable(),
  exitCode: z.number().int().nullable(),
  errorMessage: z.string().nullable(),
  createdAt: z.string(),
});
export type RunDto = z.infer<typeof RunDtoSchema>;

export const CreateRunInputSchema = z.object({
  /** Optional — defaults to the agent's latest version. */
  version: z.string().optional(),
  /** Extra env merged on top of the manifest's env. */
  env: z.record(z.string()).optional(),
});
export type CreateRunInput = z.infer<typeof CreateRunInputSchema>;
