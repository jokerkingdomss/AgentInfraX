import { Module } from '@nestjs/common';
import { MockDriver } from './mock-driver';
import { RunsController } from './runs.controller';
import { RunsService } from './runs.service';

@Module({
  controllers: [RunsController],
  providers: [RunsService, MockDriver],
  exports: [RunsService],
})
export class RunsModule {}
