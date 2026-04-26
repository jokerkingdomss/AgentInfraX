import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AgentsModule } from './agents/agents.module';
import { HealthController } from './health/health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { RunsModule } from './runs/runs.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RedisModule,
    PrismaModule,
    AgentsModule,
    RunsModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
