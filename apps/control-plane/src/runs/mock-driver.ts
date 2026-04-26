import { Injectable, Logger } from '@nestjs/common';
import type { AgentManifest } from '@agentinfra/shared-types';
import type { RuntimeDriver, RuntimeHandle, ContainerLifecycleEvent } from '@agentinfra/runtime-drivers';

/**
 * MockDriver — simulates agent lifecycle in-memory for M1a.
 *
 * Behavior:
 *   - start:   transitions pending -> starting (instant), then starting -> running
 *              after ~500ms, then running -> succeeded after ~5s (fake work).
 *   - stop:    transitions current -> stopped.
 *   - logs:    emits a fake message every second until the run finishes.
 *
 * This will be replaced by DockerDriver in M1b but the service layer should not change.
 */
@Injectable()
export class MockDriver implements RuntimeDriver {
  readonly name = 'mock';
  private readonly logger = new Logger(MockDriver.name);
  private readonly handles = new Map<string, RuntimeHandle>();
  private readonly timers = new Map<string, NodeJS.Timeout[]>();

  async start(runId: string, manifest: AgentManifest): Promise<RuntimeHandle> {
    this.logger.log(`mock start runId=${runId} image=${manifest.image}`);
    const handle: RuntimeHandle = {
      runId,
      containerId: `mock-${runId.slice(0, 8)}`,
      status: 'starting',
      startedAt: new Date().toISOString(),
    };
    this.handles.set(runId, handle);
    this.timers.set(runId, []);

    this.schedule(runId, 500, () => {
      const h = this.handles.get(runId);
      if (h && h.status === 'starting') {
        h.status = 'running';
        this.logger.log(`mock running runId=${runId}`);
      }
    });
    this.schedule(runId, 5000, () => {
      const h = this.handles.get(runId);
      if (h && h.status === 'running') {
        h.status = 'succeeded';
        h.finishedAt = new Date().toISOString();
        h.exitCode = 0;
        this.logger.log(`mock succeeded runId=${runId}`);
      }
    });

    return handle;
  }

  async stop(runId: string): Promise<void> {
    const h = this.handles.get(runId);
    if (!h) return;
    if (h.status === 'running' || h.status === 'starting' || h.status === 'pending') {
      h.status = 'stopped';
      h.finishedAt = new Date().toISOString();
    }
    this.clearTimers(runId);
    this.logger.log(`mock stop runId=${runId}`);
  }

  async status(runId: string): Promise<RuntimeHandle> {
    const h = this.handles.get(runId);
    if (!h) throw new Error(`unknown runId ${runId}`);
    return { ...h };
  }

  async *logs(runId: string, opts?: { follow?: boolean }): AsyncIterable<string> {
    let i = 0;
    while (true) {
      const h = this.handles.get(runId);
      if (!h) break;
      yield `[mock] tick ${i++} status=${h.status}`;
      if (!opts?.follow || ['succeeded', 'failed', 'stopped'].includes(h.status)) break;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  watchEvents(_onEvent: (event: ContainerLifecycleEvent) => void): () => void {
    // Mock driver does not emit real container events.
    return () => {};
  }

  private schedule(runId: string, ms: number, fn: () => void): void {
    const t = setTimeout(fn, ms);
    this.timers.get(runId)?.push(t);
  }

  private clearTimers(runId: string): void {
    for (const t of this.timers.get(runId) ?? []) clearTimeout(t);
    this.timers.delete(runId);
  }
}
