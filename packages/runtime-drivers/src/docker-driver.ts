import Dockerode from 'dockerode';
import type { AgentManifest } from '@agentinfra/shared-types';
import type { RuntimeDriver, RuntimeHandle } from './index.js';

/**
 * DockerDriver — runs agent containers via the local Docker daemon.
 *
 * Lifecycle:
 *   start  → docker.createContainer → container.start → return handle
 *   stop   → container.stop (graceful 10s) → container.remove
 *   status → container.inspect → map state to RunStatus
 *   logs   → container.logs (follow stream)
 */
export interface DockerDriverOptions {
  dockerOptions?: Dockerode.DockerOptions;
  /** When true, finished containers are kept (Exited state) for debugging. Default: false. */
  keepContainers?: boolean;
}

export class DockerDriver implements RuntimeDriver {
  readonly name = 'docker';
  private readonly docker: Dockerode;
  private readonly keepContainers: boolean;

  /** Map runId → Docker container ID for tracking. */
  private readonly containerIds = new Map<string, string>();

  constructor(opts?: DockerDriverOptions) {
    this.docker = new Dockerode(opts?.dockerOptions);
    this.keepContainers = opts?.keepContainers ?? false;
  }

  async start(runId: string, manifest: AgentManifest): Promise<RuntimeHandle> {
    // Ensure the image exists locally (pull if needed).
    await this.ensureImage(manifest.image);

    const env = Object.entries(manifest.env ?? {}).map(([k, v]) => `${k}=${v}`);
    env.push(`AGENT_NAME=${manifest.name}`);
    env.push(`RUN_ID=${runId}`);

    const container = await this.docker.createContainer({
      Image: manifest.image,
      Cmd: manifest.entrypoint.length > 0 ? manifest.entrypoint : undefined,
      Env: env,
      Labels: {
        'agentinfra.run-id': runId,
        'agentinfra.agent': manifest.name,
        'agentinfra.version': manifest.version,
      },
      HostConfig: {
        // Resource limits from manifest
        Memory: this.parseMemory(manifest.resources.memory),
        NanoCpus: this.parseCpu(manifest.resources.cpu),
        AutoRemove: false,
      },
    });

    this.containerIds.set(runId, container.id);
    await container.start();

    return {
      runId,
      containerId: container.id,
      status: 'running',
      startedAt: new Date().toISOString(),
    };
  }

  async stop(runId: string): Promise<void> {
    const cid = this.containerIds.get(runId);
    if (!cid) return;
    const container = this.docker.getContainer(cid);
    try {
      await container.stop({ t: 10 });
    } catch (err: unknown) {
      // Container may have already stopped — ignore 304 (not modified).
      if (!this.isNotModifiedOrNotFound(err)) throw err;
    }
    try {
      await container.remove({ force: true });
    } catch {
      // Best-effort removal.
    }
    this.containerIds.delete(runId);
  }

  async status(runId: string): Promise<RuntimeHandle> {
    const cid = this.containerIds.get(runId);
    if (!cid) {
      return { runId, status: 'failed', errorMessage: 'container not tracked' };
    }

    const container = this.docker.getContainer(cid);
    let info: Dockerode.ContainerInspectInfo;
    try {
      info = await container.inspect();
    } catch (err: unknown) {
      // Container removed externally.
      this.containerIds.delete(runId);
      return { runId, status: 'failed', errorMessage: 'container not found' };
    }

    const state = info.State;

    if (state.Running) {
      return {
        runId,
        containerId: cid,
        status: 'running',
        startedAt: state.StartedAt,
      };
    }

    // Container finished.
    const exitCode = state.ExitCode ?? -1;
    const handle: RuntimeHandle = {
      runId,
      containerId: cid,
      status: exitCode === 0 ? 'succeeded' : 'failed',
      startedAt: state.StartedAt,
      finishedAt: state.FinishedAt,
      exitCode,
      errorMessage: exitCode !== 0 ? (state.Error || `exit code ${exitCode}`) : undefined,
    };

    // Clean up finished container unless keepContainers is set.
    if (!this.keepContainers) {
      try {
        await container.remove({ force: true });
      } catch {
        // Best-effort.
      }
    }
    this.containerIds.delete(runId);

    return handle;
  }

  async *logs(
    runId: string,
    opts?: { follow?: boolean; tailLines?: number },
  ): AsyncIterable<string> {
    const cid = this.containerIds.get(runId);
    if (!cid) return;

    const container = this.docker.getContainer(cid);
    const follow = opts?.follow ?? false;
    const logOpts = {
      stdout: true,
      stderr: true,
      tail: opts?.tailLines ?? 100,
    };

    // Dockerode overloads differ on `follow` literal types; call explicitly.
    const stream = follow
      ? await container.logs({ ...logOpts, follow: true as const })
      : await container.logs({ ...logOpts, follow: false as const });

    // Non-follow returns a Buffer; follow returns a ReadableStream.
    if (Buffer.isBuffer(stream)) {
      const text = this.demux(stream);
      if (text) yield text;
      return;
    }

    const reader = stream as unknown as NodeJS.ReadableStream;
    for await (const chunk of reader) {
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string);
      // Docker multiplexed stream: 8-byte header [type(1) + 0(3) + size(4)] + payload.
      // For simplicity, strip any header bytes and yield the text.
      const text = this.demux(buf);
      if (text) yield text;
    }
  }

  // ── Helpers ───────────────────────────────────────────

  private async ensureImage(image: string): Promise<void> {
    try {
      await this.docker.getImage(image).inspect();
    } catch {
      // Image not present locally — pull it.
      const pullStream = await this.docker.pull(image);
      await new Promise<void>((resolve, reject) => {
        this.docker.modem.followProgress(pullStream, (err: Error | null) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  }

  /** Parse Kubernetes-style CPU string to Docker NanoCpus (1 CPU = 1e9). */
  private parseCpu(cpu: string): number {
    if (cpu.endsWith('m')) {
      return parseInt(cpu, 10) * 1e6; // 500m → 500_000_000
    }
    return parseFloat(cpu) * 1e9; // "1" → 1_000_000_000
  }

  /** Parse Kubernetes-style memory string to bytes. */
  private parseMemory(mem: string): number {
    const units: Record<string, number> = {
      Ki: 1024,
      Mi: 1024 ** 2,
      Gi: 1024 ** 3,
      K: 1000,
      M: 1000 ** 2,
      G: 1000 ** 3,
    };
    for (const [suffix, multiplier] of Object.entries(units)) {
      if (mem.endsWith(suffix)) {
        return parseInt(mem, 10) * multiplier;
      }
    }
    return parseInt(mem, 10); // raw bytes
  }

  /** Demux Docker multiplexed stream frame into text. */
  private demux(buf: Buffer): string {
    // If the buffer looks like a multiplexed frame (header byte 0x01 or 0x02),
    // skip the 8-byte header per chunk.
    const lines: string[] = [];
    let offset = 0;
    while (offset < buf.length) {
      const type = buf[offset];
      if ((type === 1 || type === 2) && offset + 8 <= buf.length) {
        const size = buf.readUInt32BE(offset + 4);
        if (offset + 8 + size <= buf.length) {
          lines.push(buf.subarray(offset + 8, offset + 8 + size).toString('utf-8'));
          offset += 8 + size;
          continue;
        }
      }
      // Not a multiplexed frame — treat as raw text.
      lines.push(buf.subarray(offset).toString('utf-8'));
      break;
    }
    return lines.join('');
  }

  private isNotModifiedOrNotFound(err: unknown): boolean {
    if (err && typeof err === 'object' && 'statusCode' in err) {
      const code = (err as { statusCode: number }).statusCode;
      return code === 304 || code === 404;
    }
    return false;
  }
}
