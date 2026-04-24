import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { LogsService } from './logs.service';

@Controller()
export class LogsController {
  constructor(private readonly logs: LogsService) {}

  @Post('runs/:id/logs')
  append(
    @Param('id') runId: string,
    @Body() body: { level?: string; message: string },
  ) {
    return this.logs.append(runId, body.level ?? 'info', body.message);
  }

  @Get('runs/:id/logs')
  findByRun(@Param('id') runId: string) {
    return this.logs.findByRun(runId);
  }
}
