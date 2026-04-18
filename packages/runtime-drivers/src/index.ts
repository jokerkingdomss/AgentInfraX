import type { AgentManifest, RunStatus } from '@agentinfra/shared-types';

/** Handle returned from a driver — opaque to the control plane. */
export interface RuntimeHandle {
  runId: string;
  containerId?: string;
  status: RunStatus;
  startedAt?: string;
  finishedAt?: string;
  exitCode?: number;
  errorMessage?: string;
}

/**
 * RuntimeDriver is the abstraction shared by MockDriver (M1a), DockerDriver (M1b), and K8sDriver (M6).
 */
export interface RuntimeDriver {
  readonly name: string;

  /** Start a new agent instance and return a handle. */
  start(runId: string, manifest: AgentManifest): Promise<RuntimeHandle>;

  /** Stop a running agent. Idempotent. */
  stop(runId: string): Promise<void>;

  /** Fetch current status. */
  status(runId: string): Promise<RuntimeHandle>;

  /** Stream (or batch-fetch) logs; implementation detail left to driver. */
  logs(runId: string, opts?: { follow?: boolean; tailLines?: number }): AsyncIterable<string>;
}
