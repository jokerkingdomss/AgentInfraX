import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { AgentManifest, CreateRunInput, RunDto, RunStatus } from '@agentinfra/shared-types';
import type { RuntimeDriver } from '@agentinfra/runtime-drivers';
import Redis from 'ioredis';
import { PrismaService } from '../prisma/prisma.service';
import { RUNTIME_DRIVER } from './constants';
import { LogsService } from './logs.service';
import { RunLogsGateway } from './run-logs.gateway';
import { RunEventsWatcher } from './run-events.watcher';

@Injectable()
export class RunsService {
  private readonly logger = new Logger(RunsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(RUNTIME_DRIVER) private readonly driver: RuntimeDriver,
    private readonly gateway: RunLogsGateway,
    private readonly eventsWatcher: RunEventsWatcher,
    private readonly logsService: LogsService,
    @Inject('REDIS') private readonly redis: Redis,
  ) {
    this.logger.log(`Using runtime driver: ${this.driver.name}`);
  }

  async create(agentName: string, input: CreateRunInput): Promise<RunDto> {
    const agent = await this.prisma.agent.findUnique({
      where: { name: agentName },
      include: {
        versions: input.version
          ? { where: { version: input.version } }
          : { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });
    if (!agent) throw new NotFoundException(`agent "${agentName}" not found`);
    const version = agent.versions[0];
    if (!version) {
      throw new NotFoundException(
        input.version
          ? `version ${input.version} not found for ${agentName}`
          : `agent "${agentName}" has no versions yet`,
      );
    }

    const run = await this.prisma.run.create({
      data: {
        agentId: agent.id,
        agentVersionId: version.id,
        status: 'pending',
      },
    });

    // Start asynchronously via driver; don't await full lifecycle.
    const manifest: AgentManifest = {
      name: agent.name,
      version: version.version,
      image: version.image,
      entrypoint: (version.entrypoint as string[]) ?? [],
      env: { ...((version.env as Record<string, string>) ?? {}), ...(input.env ?? {}) },
      resources: (version.resources as { cpu: string; memory: string }) ?? {
        cpu: '500m',
        memory: '512Mi',
      },
      timeout: version.timeout ?? 300,
    };

    void this.driver
      .start(run.id, manifest)
      .then(async (h) => {
        await this.prisma.run.update({
          where: { id: run.id },
          data: {
            status: h.status,
            containerId: h.containerId ?? null,
            startedAt: h.startedAt ? new Date(h.startedAt) : null,
          },
        });
        // Store containerId → runId mapping in Redis for event-driven lookups.
        if (h.containerId) {
          await this.redis.set(
            `run:container:${h.containerId}`,
            run.id,
            'EX',
            86400, // 24h TTL — containers shouldn't live longer.
          );
        }
        this.gateway.emitStatusUpdated(run.id, h.status);
        this.eventsWatcher.scheduleTimeout(run.id, version.timeout);
        // Stream container stdout/stderr to logs in real time.
        this.streamContainerLogs(run.id);
      })
      .catch(async (err: Error) => {
        await this.prisma.run.update({
          where: { id: run.id },
          data: { status: 'failed', errorMessage: err.message, finishedAt: new Date() },
        });
        this.gateway.emitStatusUpdated(run.id, 'failed');
      });

    return this.toDto({
      ...run,
      agentName: agent.name,
      agentVersion: version.version,
    });
  }

  async findByAgent(agentName: string): Promise<RunDto[]> {
    const agent = await this.prisma.agent.findUnique({
      where: { name: agentName },
      include: {
        runs: { orderBy: { createdAt: 'desc' }, include: { agentVersion: true } },
      },
    });
    if (!agent) throw new NotFoundException(`agent "${agentName}" not found`);
    return agent.runs.map((r) =>
      this.toDto({ ...r, agentName: agent.name, agentVersion: r.agentVersion.version }),
    );
  }

  async findAll(limit = 50, offset = 0): Promise<{ items: RunDto[]; total: number }> {
    const [runs, total] = await Promise.all([
      this.prisma.run.findMany({
        orderBy: { createdAt: 'desc' },
        include: { agent: true, agentVersion: true },
        take: limit,
        skip: offset,
      }),
      this.prisma.run.count(),
    ]);
    return {
      items: runs.map((r) =>
        this.toDto({ ...r, agentName: r.agent.name, agentVersion: r.agentVersion.version }),
      ),
      total,
    };
  }

  async findOne(runId: string): Promise<RunDto> {
    const run = await this.prisma.run.findUnique({
      where: { id: runId },
      include: { agent: true, agentVersion: true },
    });
    if (!run) throw new NotFoundException(`run ${runId} not found`);
    return this.toDto({
      ...run,
      agentName: run.agent.name,
      agentVersion: run.agentVersion.version,
    });
  }

  async stop(runId: string): Promise<RunDto> {
    const run = await this.prisma.run.findUnique({ where: { id: runId } });
    if (!run) throw new NotFoundException(`run ${runId} not found`);
    // Update DB to 'stopped' BEFORE stopping container so events watcher
    // sees the stopped status and skips overwriting with 'failed'.
    const updated = await this.prisma.run.update({
      where: { id: runId },
      data: { status: 'stopped', finishedAt: new Date() },
    });
    this.gateway.emitStatusUpdated(runId, 'stopped');
    await this.driver.stop(runId);
    return this.findOne(updated.id);
  }

  /**
   * Stream container stdout/stderr via driver.logs({ follow: true }),
   * line-by-line into LogsService.append() which persists to DB and
   * broadcasts via Socket.IO. The async iterator ends when the container exits.
   */
  private streamContainerLogs(runId: string): void {
    (async () => {
      try {
        for await (const chunk of this.driver.logs(runId, { follow: true })) {
          // Docker may deliver multiple lines in one chunk; split them.
          const lines = chunk.split('\n').filter((l) => l.length > 0);
          for (const line of lines) {
            await this.logsService.append(runId, 'info', line);
          }
        }
      } catch (err) {
        // Container may have already been removed — that's fine.
        this.logger.debug(`Log stream ended for run ${runId.slice(0, 8)}…: ${(err as Error).message}`);
      }
    })();
  }

  private toDto(r: {
    id: string;
    agentName: string;
    agentVersion: string;
    status: RunStatus;
    containerId: string | null;
    startedAt: Date | null;
    finishedAt: Date | null;
    exitCode: number | null;
    errorMessage: string | null;
    createdAt: Date;
  }): RunDto {
    return {
      id: r.id,
      agentName: r.agentName,
      agentVersion: r.agentVersion,
      status: r.status,
      containerId: r.containerId,
      startedAt: r.startedAt?.toISOString() ?? null,
      finishedAt: r.finishedAt?.toISOString() ?? null,
      exitCode: r.exitCode,
      errorMessage: r.errorMessage,
      createdAt: r.createdAt.toISOString(),
    };
  }
}
