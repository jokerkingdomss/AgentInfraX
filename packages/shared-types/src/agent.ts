import { z } from 'zod';

/** Valid agent name: lowercase alnum + hyphen, starting with alnum. */
export const AgentNameSchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9][a-z0-9-]*$/, 'lowercase, digits, and hyphens only');

/** Resource requests. CPU as Kubernetes-style string ("500m", "1", "2"), memory as "512Mi" / "1Gi". */
export const ResourcesSchema = z.object({
  cpu: z.string().default('500m'),
  memory: z.string().default('512Mi'),
});

/** User-facing agent manifest — one per agent version. */
export const AgentManifestSchema = z.object({
  name: AgentNameSchema,
  version: z.string().min(1).default('0.0.1'),
  image: z.string().min(1),
  entrypoint: z.array(z.string()).default([]),
  env: z.record(z.string()).default({}),
  resources: ResourcesSchema.default({ cpu: '500m', memory: '512Mi' }),
  timeout: z.number().int().min(0).default(300),
});
export type AgentManifest = z.infer<typeof AgentManifestSchema>;

/** DTO returned from the API for an Agent resource. */
export const AgentDtoSchema = z.object({
  id: z.string(),
  name: AgentNameSchema,
  description: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  latestVersion: z.string().nullable(),
});
export type AgentDto = z.infer<typeof AgentDtoSchema>;

export const CreateAgentInputSchema = z.object({
  name: AgentNameSchema,
  description: z.string().max(500).optional(),
});
export type CreateAgentInput = z.infer<typeof CreateAgentInputSchema>;

export const CreateAgentVersionInputSchema = AgentManifestSchema.omit({ name: true });
export type CreateAgentVersionInput = z.infer<typeof CreateAgentVersionInputSchema>;
