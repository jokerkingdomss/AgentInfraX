import { Body, Controller, Delete, Get, HttpCode, Param, Post } from '@nestjs/common';
import {
  CreateAgentInputSchema,
  CreateAgentVersionInputSchema,
  type CreateAgentInput,
  type CreateAgentVersionInput,
} from '@agentinfra/shared-types';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { AgentsService } from './agents.service';

@Controller('agents')
export class AgentsController {
  constructor(private readonly agents: AgentsService) {}

  @Post()
  create(@Body(new ZodValidationPipe(CreateAgentInputSchema)) dto: CreateAgentInput) {
    return this.agents.create(dto);
  }

  @Get()
  findAll() {
    return this.agents.findAll();
  }

  @Get(':name')
  findOne(@Param('name') name: string) {
    return this.agents.findByName(name);
  }

  @Delete(':name')
  @HttpCode(204)
  async remove(@Param('name') name: string): Promise<void> {
    await this.agents.remove(name);
  }

  @Post(':name/versions')
  addVersion(
    @Param('name') name: string,
    @Body(new ZodValidationPipe(CreateAgentVersionInputSchema)) dto: CreateAgentVersionInput,
  ) {
    return this.agents.addVersion(name, dto);
  }

  @Get(':name/versions')
  listVersions(@Param('name') name: string) {
    return this.agents.listVersions(name);
  }
}
