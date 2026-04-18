import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import type {
  AgentDto,
  CreateAgentInput,
  CreateAgentVersionInput,
} from '@agentinfra/shared-types';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AgentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateAgentInput): Promise<AgentDto> {
    const existing = await this.prisma.agent.findUnique({ where: { name: input.name } });
    if (existing) {
      throw new ConflictException(`agent "${input.name}" already exists`);
    }
    const agent = await this.prisma.agent.create({
      data: {
        name: input.name,
        description: input.description ?? null,
      },
    });
    return this.toDto(agent, null);
  }

  async findAll(): Promise<AgentDto[]> {
    const agents = await this.prisma.agent.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        versions: { orderBy: { createdAt: 'desc' }, take: 1, select: { version: true } },
      },
    });
    return agents.map((a) => this.toDto(a, a.versions[0]?.version ?? null));
  }

  async findByName(name: string): Promise<AgentDto> {
    const agent = await this.prisma.agent.findUnique({
      where: { name },
      include: {
        versions: { orderBy: { createdAt: 'desc' }, take: 1, select: { version: true } },
      },
    });
    if (!agent) throw new NotFoundException(`agent "${name}" not found`);
    return this.toDto(agent, agent.versions[0]?.version ?? null);
  }

  async remove(name: string): Promise<void> {
    const agent = await this.prisma.agent.findUnique({ where: { name } });
    if (!agent) throw new NotFoundException(`agent "${name}" not found`);
    await this.prisma.agent.delete({ where: { id: agent.id } });
  }

  async addVersion(name: string, input: CreateAgentVersionInput): Promise<{ version: string }> {
    const agent = await this.prisma.agent.findUnique({ where: { name } });
    if (!agent) throw new NotFoundException(`agent "${name}" not found`);

    const existing = await this.prisma.agentVersion.findUnique({
      where: { agentId_version: { agentId: agent.id, version: input.version } },
    });
    if (existing) {
      throw new ConflictException(`version ${input.version} already exists for ${name}`);
    }

    const created = await this.prisma.agentVersion.create({
      data: {
        agentId: agent.id,
        version: input.version,
        image: input.image,
        entrypoint: input.entrypoint,
        env: input.env,
        resources: input.resources,
      },
    });
    return { version: created.version };
  }

  async listVersions(name: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { name },
      include: { versions: { orderBy: { createdAt: 'desc' } } },
    });
    if (!agent) throw new NotFoundException(`agent "${name}" not found`);
    return agent.versions;
  }

  private toDto(
    agent: { id: string; name: string; description: string | null; createdAt: Date; updatedAt: Date },
    latestVersion: string | null,
  ): AgentDto {
    return {
      id: agent.id,
      name: agent.name,
      description: agent.description,
      createdAt: agent.createdAt.toISOString(),
      updatedAt: agent.updatedAt.toISOString(),
      latestVersion,
    };
  }
}
