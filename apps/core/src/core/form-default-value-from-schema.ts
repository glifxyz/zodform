import { range } from 'lodash-es';
import { type ZodDiscriminatedUnion, type ZodFirstPartySchemaTypes, type ZodObject } from 'zod';
import {
  isZodArray,
  isZodBoolean,
  isZodDate,
  isZodDefault,
  isZodDiscriminatedUnion,
  isZodEffects,
  isZodEnum,
  isZodLiteral,
  isZodNullable,
  isZodNumber,
  isZodObject,
  isZodOptional,
  isZodString
} from './schema-type-resolvers';

export function formDefaultValueFromSchema(
  schema: ZodObject<any> | ZodDiscriminatedUnion<any, any>
): Record<string, any> {
  return iterator(schema);

  function iterator(schema: ZodFirstPartySchemaTypes): any {
    if (isZodLiteral(schema)) {
      return schema._def.value;
    }
    if (isZodString(schema)) {
      return undefined;
    }
    if (isZodNumber(schema)) {
      return undefined;
    }
    if (isZodBoolean(schema)) {
      return false;
    }
    if (isZodEnum(schema)) {
      return undefined;
    }
    if (isZodOptional(schema)) {
      return schema._def.innerType !== undefined ? iterator(schema._def.innerType) : undefined;
    }
    if (isZodNullable(schema)) {
      return schema._def.innerType !== undefined ? iterator(schema._def.innerType) : undefined;
    }
    if (isZodDate(schema)) {
      return undefined;
    }
    if (isZodArray(schema)) {
      if (isZodEnum(schema._def.type)) {
        return [];
      }

      return range(0, schema._def.exactLength?.value ?? schema._def.minLength?.value ?? 0).map(() =>
        iterator(schema._def.type)
      );
    }
    if (isZodDefault(schema)) {
      return schema._def.defaultValue();
    }
    if (isZodObject(schema)) {
      const obj: Record<string, any> = {};
      for (const [key, value] of Object.entries(schema.shape)) {
        obj[key] = iterator(value as ZodFirstPartySchemaTypes);
        if (obj[key] === undefined) {
          delete obj[key];
        }
      }
      return obj;
    }
    if (isZodEffects(schema)) {
      return iterator(schema._def.schema);
    }
    if (isZodDiscriminatedUnion(schema)) {
      // TODO: Handle discriminated unions
      // in our case, we pass the values in explicitly (derived from Zod), so we don't _need_ this
      return undefined;
    }
    throw new Error(`Unsupported schema type: ${schema._def.typeName}`);
  }
}
