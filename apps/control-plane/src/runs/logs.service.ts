import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LogsService {
  private readonly logger = new Logger(LogsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async append(runId: string, level: string, message: string) {
    const run = await this.prisma.run.findUnique({ where: { id: runId } });
    if (!run) throw new NotFoundException(`run ${runId} not found`);

    return this.prisma.runLog.create({
      data: { runId, level: level ?? 'info', message },
    });
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
