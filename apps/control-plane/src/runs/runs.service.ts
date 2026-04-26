import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type { AgentManifest, CreateRunInput, RunDto, RunStatus } from '@agentinfra/shared-types';
import type { RuntimeDriver } from '@agentinfra/runtime-drivers';
import { PrismaService } from '../prisma/prisma.service';
import { RUNTIME_DRIVER } from './constants';
import { RunLogsGateway } from './run-logs.gateway';

@Injectable()
export class RunsService {
  private readonly logger = new Logger(RunsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(RUNTIME_DRIVER) private readonly driver: RuntimeDriver,
    private readonly gateway: RunLogsGateway,
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
        this.gateway.emitStatusUpdated(run.id, h.status);
        // Poll driver until terminal state and sync DB.
        void this.pollUntilDone(run.id, version.timeout);
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
    await this.driver.stop(runId);
    const updated = await this.prisma.run.update({
      where: { id: runId },
      data: { status: 'stopped', finishedAt: new Date() },
    });
    this.gateway.emitStatusUpdated(runId, 'stopped');
    return this.findOne(updated.id);
  }

  private async pollUntilDone(runId: string, timeoutSeconds = 300): Promise<void> {
    const terminal: RunStatus[] = ['succeeded', 'failed', 'stopped'];
    const maxAttempts = timeoutSeconds;
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      // If the run was manually stopped, stop polling.
      const current = await this.prisma.run.findUnique({ where: { id: runId } });
      if (current?.status === 'stopped') return;
      let h;
      try {
        h = await this.driver.status(runId);
      } catch {
        return;
      }
      await this.prisma.run.update({
        where: { id: runId },
        data: {
          status: h.status,
          finishedAt: h.finishedAt ? new Date(h.finishedAt) : null,
          exitCode: h.exitCode ?? null,
          errorMessage: h.errorMessage ?? null,
        },
      });
      this.gateway.emitStatusUpdated(runId, h.status);
      if (terminal.includes(h.status)) return;
    }
    // Timeout: stop the container and mark as failed.
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
