import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CreateRunInputSchema, type CreateRunInput } from '@agentinfra/shared-types';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { RunsService } from './runs.service';

@Controller()
export class RunsController {
  constructor(private readonly runs: RunsService) {}

  @Post('agents/:name/runs')
  create(
    @Param('name') name: string,
    @Body(new ZodValidationPipe(CreateRunInputSchema)) dto: CreateRunInput,
  ) {
    return this.runs.create(name, dto);
  }

  @Get('agents/:name/runs')
  listForAgent(@Param('name') name: string) {
    return this.runs.findByAgent(name);
  }

  @Get('runs')
  findAll(@Query('limit') limit?: string, @Query('offset') offset?: string) {
    return this.runs.findAll(
      limit ? parseInt(limit, 10) : 50,
      offset ? parseInt(offset, 10) : 0,
    );
  }

  @Get('runs/:id')
  findOne(@Param('id') id: string) {
    return this.runs.findOne(id);
  }

  @Post('runs/:id/stop')
  stop(@Param('id') id: string) {
    return this.runs.stop(id);
  }
}
