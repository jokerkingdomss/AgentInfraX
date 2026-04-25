import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { RuntimeDriver } from '@agentinfra/runtime-drivers';
import { DockerDriver } from '@agentinfra/runtime-drivers';
import { MockDriver } from './mock-driver';
import { RUNTIME_DRIVER } from './constants';
import { LogsController } from './logs.controller';
import { LogsService } from './logs.service';
import { RunLogsGateway } from './run-logs.gateway';
import { RunsController } from './runs.controller';
import { RunsService } from './runs.service';

@Module({
  controllers: [RunsController, LogsController],
  providers: [
    RunsService,
    LogsService,
    RunLogsGateway,
    MockDriver,
    {
      provide: RUNTIME_DRIVER,
      useFactory: (config: ConfigService): RuntimeDriver => {
        const driver = config.get<string>('RUNTIME_DRIVER', 'mock');
        if (driver === 'docker') {
          const keepContainers = config.get<string>('KEEP_CONTAINERS', 'false') === 'true';
          return new DockerDriver({ keepContainers });
        }
        return new MockDriver();
      },
      inject: [ConfigService],
    },
  ],
  exports: [RunsService, RunLogsGateway],
})
export class RunsModule {}
