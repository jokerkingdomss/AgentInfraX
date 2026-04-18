import { BadRequestException, PipeTransform } from '@nestjs/common';
import type { ZodSchema } from 'zod';

/**
 * Validates the incoming value against a zod schema.
 * Usage: `@Body(new ZodValidationPipe(CreateAgentInputSchema)) dto`.
 */
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        message: 'validation failed',
        issues: result.error.issues,
      });
    }
    return result.data;
  }
}
