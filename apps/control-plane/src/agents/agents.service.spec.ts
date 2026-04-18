import { ConflictException, NotFoundException } from '@nestjs/common';
import { AgentsService } from './agents.service';
import type { PrismaService } from '../prisma/prisma.service';

/**
 * Minimal unit test — we mock PrismaService so this runs with no DB.
 * Covers the 4 main branches of AgentsService.create/findByName.
 */
describe('AgentsService', () => {
  let prismaMock: {
    agent: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      delete: jest.Mock;
    };
    agentVersion: { findUnique: jest.Mock; create: jest.Mock };
  };
  let svc: AgentsService;

  beforeEach(() => {
    prismaMock = {
      agent: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      agentVersion: { findUnique: jest.fn(), create: jest.fn() },
    };
    svc = new AgentsService(prismaMock as unknown as PrismaService);
  });

  const fakeAgent = (overrides: Partial<Record<string, unknown>> = {}) => ({
    id: 'a1',
    name: 'demo',
    description: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  });

  describe('create', () => {
    it('creates a new agent when name is unique', async () => {
      prismaMock.agent.findUnique.mockResolvedValue(null);
      prismaMock.agent.create.mockResolvedValue(fakeAgent());

      const dto = await svc.create({ name: 'demo' });
      expect(dto.name).toBe('demo');
      expect(dto.latestVersion).toBeNull();
      expect(prismaMock.agent.create).toHaveBeenCalledWith({
        data: { name: 'demo', description: null },
      });
    });

    it('throws ConflictException when name exists', async () => {
      prismaMock.agent.findUnique.mockResolvedValue(fakeAgent());
      await expect(svc.create({ name: 'demo' })).rejects.toBeInstanceOf(ConflictException);
      expect(prismaMock.agent.create).not.toHaveBeenCalled();
    });
  });

  describe('findByName', () => {
    it('returns the agent with latest version', async () => {
      prismaMock.agent.findUnique.mockResolvedValue({
        ...fakeAgent(),
        versions: [{ version: '0.2.0' }],
      });
      const dto = await svc.findByName('demo');
      expect(dto.latestVersion).toBe('0.2.0');
    });

    it('throws NotFoundException when missing', async () => {
      prismaMock.agent.findUnique.mockResolvedValue(null);
      await expect(svc.findByName('missing')).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
