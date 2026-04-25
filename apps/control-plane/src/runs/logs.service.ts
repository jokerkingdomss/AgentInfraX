import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RunLogsGateway } from './run-logs.gateway';

@Injectable()
export class LogsService {
  private readonly logger = new Logger(LogsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: RunLogsGateway,
  ) {}

  async append(runId: string, level: string, message: string) {
    const run = await this.prisma.run.findUnique({ where: { id: runId } });
    if (!run) throw new NotFoundException(`run ${runId} not found`);

    const log = await this.prisma.runLog.create({
      data: { runId, level: level ?? 'info', message },
    });

    this.gateway.emitLogAppended(runId, {
      id: log.id,
      runId: log.runId,
      level: log.level,
      message: log.message,
      createdAt: log.createdAt.toISOString(),
    });

    return log;
  }

  async findByRun(runId: string) {
    const run = await this.prisma.run.findUnique({ where: { id: runId } });
    if (!run) throw new NotFoundException(`run ${runId} not found`);

    return this.prisma.runLog.findMany({
      where: { runId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
