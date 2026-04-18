import type { AgentManifest, AgentRun } from '@agentinfra/shared-types';

/**
 * RuntimeDriver is the abstraction shared by DockerDriver (M1) and K8sDriver (M6).
 * M0 only defines the contract.
 */
export interface RuntimeDriver {
  readonly name: string;

  /** Start a new agent instance and return the run handle. */
  start(manifest: AgentManifest): Promise<AgentRun>;

  /** Stop a running agent. Idempotent. */
  stop(runId: string): Promise<void>;

  /** Fetch current status. */
  status(runId: string): Promise<AgentRun>;

  /** Stream (or batch-fetch) logs; implementation detail left to driver. */
  logs(runId: string, opts?: { follow?: boolean; tailLines?: number }): AsyncIterable<string>;
}
