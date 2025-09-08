import { describe, expectTypeOf, test } from 'vitest';
import { z } from 'zod';
import { type ExtractSchemaFromEffects } from './extract-schema-from-effects';

describe('ExtractSchemaFromEffects', function () {
  test('works', function () {
    const schema = z.object({
      people: z
        .array(
          z.object({
            age: z.number()
          })
        )
        .min(1)
    });
    const _schemaWithEffects = schema
      .refine(() => true)
      .refine(() => true)
      .refine(() => true);

    type SchemaWithEffects = typeof _schemaWithEffects;

    expectTypeOf<ExtractSchemaFromEffects<SchemaWithEffects>>().toMatchTypeOf<typeof schema>();
  });
});
