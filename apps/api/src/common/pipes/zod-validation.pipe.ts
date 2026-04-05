import { PipeTransform, BadRequestException } from '@nestjs/common';
import type { ZodSchema, ZodError } from 'zod';

export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown): unknown {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const errors = (result.error as ZodError).flatten();
      throw new BadRequestException({
        message: 'Validation failed',
        errors,
      });
    }
    return result.data;
  }
}
