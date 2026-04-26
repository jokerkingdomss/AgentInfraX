import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import type { ContainerLifecycleEvent, RuntimeDriver } from '@agentinfra/runtime-drivers';
import type { RunStatus } from '@agentinfra/shared-types';
import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import { RUNTIME_DRIVER } from './constants';
import { RunLogsGateway } from './run-logs.gateway';

const TERMINAL_ACTIONS = new Set(['die', 'stop', 'destroy', 'oom']);

@Injectable()
export class RunEventsWatcher implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RunEventsWatcher.name);
  private unsubscribe: (() => void) | null = null;
  /** Track timeout timers per runId to clear them when events arrive. */
  private readonly timeoutTimers = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly prisma: PrismaService,
    @Inject(RUNTIME_DRIVER) private readonly driver: RuntimeDriver,
    private readonly gateway: RunLogsGateway,
    @Inject('REDIS') private readonly redis: Redis,
  ) {}

  onModuleInit() {
    if (typeof this.driver.watchEvents !== 'function') {
      this.logger.warn('RuntimeDriver does not implement watchEvents — falling back to polling');
      return;
    }
    this.unsubscribe = this.driver.watchEvents((event) => this.handleEvent(event));
    this.logger.log('Subscribed to Docker container lifecycle events');
  }

  onModuleDestroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    for (const timer of this.timeoutTimers.values()) clearTimeout(timer);
    this.timeoutTimers.clear();
  }

  /**
   * Register a timeout for a run. If no terminal event arrives within
   * `timeoutSeconds`, the run is force-stopped and marked failed.
   * Call this when a run starts; the timer is cleared when a terminal
   * event is received for that run.
   */
  scheduleTimeout(runId: string, timeoutSeconds: number): void {
    // Clear any existing timer for this run.
    const existing = this.timeoutTimers.get(runId);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(async () => {
      this.timeoutTimers.delete(runId);
      this.logger.warn(`Run ${runId} timed out after ${timeoutSeconds}s`);
      try {
        await this.driver.stop(runId);
      } catch {}
      await this.prisma.run.update({
        where: { id: runId },
        data: {
          status: 'failed',
          finishedAt: new Date(),
          errorMessage: `Run timed out after ${timeoutSeconds}s`,
        },
      });
      this.gateway.emitStatusUpdated(runId, 'failed');
    }, timeoutSeconds * 1000);

    this.timeoutTimers.set(runId, timer);
  }

  private async handleEvent(event: ContainerLifecycleEvent): Promise<void> {
    const { containerId, action, exitCode } = event;

    // Resolve runId: try Redis first, then driver in-memory map, then DB.
    const runId = await this.resolveRunId(containerId);
    if (!runId) return; // Not an agentinfra container.

    this.logger.log(`Container event: ${action} for run ${runId.slice(0, 8)}…`);

    if (action === 'start') {
      await this.prisma.run.update({
        where: { id: runId },
        data: { status: 'running', startedAt: new Date() },
      });
      this.gateway.emitStatusUpdated(runId, 'running');
      return;
    }

    if (!TERMINAL_ACTIONS.has(action)) return;

    // Terminal event — clear timeout timer.
    const timer = this.timeoutTimers.get(runId);
    if (timer) {
      clearTimeout(timer);
      this.timeoutTimers.delete(runId);
    }

    // Fetch final status from driver for accurate state.
    let status: RunStatus;
    let finishedAt = new Date();
    let resolvedExitCode = exitCode ?? null;
    let errorMessage: string | null = null;

    try {
      const h = await this.driver.status(runId);
      status = h.status;
      finishedAt = h.finishedAt ? new Date(h.finishedAt) : new Date();
      resolvedExitCode = h.exitCode ?? resolvedExitCode;
      errorMessage = h.errorMessage ?? null;
    } catch {
      status = exitCode === 0 ? 'succeeded' : 'failed';
      if (exitCode !== 0 && exitCode !== undefined) {
        errorMessage = `exit code ${exitCode}`;
      }
    }

    // Don't overwrite a manually-stopped run.
    const current = await this.prisma.run.findUnique({ where: { id: runId } });
    if (current?.status === 'stopped') return;

    await this.prisma.run.update({
      where: { id: runId },
      data: {
        status,
        finishedAt,
        exitCode: resolvedExitCode,
        errorMessage,
      },
    });
    this.gateway.emitStatusUpdated(runId, status);
  }

  /** Resolve runId by containerId: Redis → driver map → DB. */
  private async resolveRunId(containerId: string): Promise<string | undefined> {
    // 1. Redis lookup (fastest, survives restart).
    const cached = await this.redis.get(`run:container:${containerId}`);
    if (cached) return cached;

    // 2. Driver in-memory map (current process only).
    if ('getRunId' in this.driver && typeof (this.driver as any).getRunId === 'function') {
      const runId = (this.driver as any).getRunId(containerId);
      if (runId) return runId;
    }

    // 3. DB fallback.
    const run = await this.prisma.run.findFirst({
      where: { containerId },
      select: { id: true },
    });
    return run?.id;
  }
}
