import type * as zod from 'zod';
import { type AnyZodObject, type ZodString } from 'zod';
import { nn } from '../utils/invariant';

export const ZodTypeName = {
  ZodString: 'ZodString',
  ZodObject: 'ZodObject',
  ZodEnum: 'ZodEnum',
  ZodNativeEnum: 'ZodNativeEnum',
  ZodArray: 'ZodArray',
  ZodOptional: 'ZodOptional',
  ZodNullable: 'ZodNullable',
  ZodNumber: 'ZodNumber',
  ZodDefault: 'ZodDefault',
  ZodBoolean: 'ZodBoolean',
  ZodEffects: 'ZodEffects',
  ZodDate: 'ZodDate',
  ZodLiteral: 'ZodLiteral',
  ZodDiscriminatedUnion: 'ZodDiscriminatedUnion'
} as const;

function getZodTypeNameFromSchema(schema: unknown): string | undefined {
  // @ts-expect-error - private property
  return schema?._def?.typeName;
}

export function isZodDiscriminatedUnion(schema: unknown): schema is zod.ZodDiscriminatedUnion<string, any> {
  const typeName = getZodTypeNameFromSchema(schema);
  nn(typeName, 'Invalid schema');

  return typeName === ZodTypeName.ZodDiscriminatedUnion;
}

export function isZodString(schema: unknown): schema is ZodString {
  const typeName = getZodTypeNameFromSchema(schema);
  nn(typeName, 'Invalid schema');

  return typeName === ZodTypeName.ZodString;
}

export function isZodLiteral(schema: unknown): schema is zod.ZodLiteral<any> {
  const typeName = getZodTypeNameFromSchema(schema);
  nn(typeName, 'Invalid schema');

  return typeName === ZodTypeName.ZodLiteral;
}

export function isZodObject(schema: unknown): schema is AnyZodObject {
  const typeName = getZodTypeNameFromSchema(schema);
  nn(typeName, 'Invalid schema');

  return typeName === ZodTypeName.ZodObject;
}

export type ZodAnyEnum = zod.ZodEnum<[any]>;

export function isZodEnum(schema: unknown): schema is ZodAnyEnum {
  const typeName = getZodTypeNameFromSchema(schema);
  nn(typeName, 'Invalid schema');

  return typeName === ZodTypeName.ZodEnum;
}

export type ZodAnyNativeEnum = zod.ZodNativeEnum<any>;

export function isZodNativeEnum(schema: unknown): schema is ZodAnyNativeEnum {
  const typeName = getZodTypeNameFromSchema(schema);
  nn(typeName, 'Invalid schema');

  return typeName === ZodTypeName.ZodNativeEnum;
}

export type ZodAnyArray = zod.ZodArray<any>;

export function isZodArray(schema: unknown): schema is ZodAnyArray {
  const typeName = getZodTypeNameFromSchema(schema);
  nn(typeName, 'Invalid schema');

  return typeName === ZodTypeName.ZodArray;
}

type ZodAnyOptional = zod.ZodOptional<any>;
type ZodAnyNullable = zod.ZodNullable<any>;

export function isZodOptional(schema: unknown): schema is ZodAnyOptional {
  const typeName = getZodTypeNameFromSchema(schema);
  nn(typeName, 'Invalid schema');

  return typeName === ZodTypeName.ZodOptional;
}

export function isZodNullable(schema: unknown): schema is ZodAnyNullable {
  const typeName = getZodTypeNameFromSchema(schema);
  nn(typeName, 'Invalid schema');

  return typeName === ZodTypeName.ZodNullable;
}

export function isZodNumber(schema: unknown): schema is zod.ZodNumber {
  const typeName = getZodTypeNameFromSchema(schema);
  nn(typeName, 'Invalid schema');

  return typeName === ZodTypeName.ZodNumber;
}

export function isZodDefault(schema: unknown): schema is zod.ZodDefault<any> {
  const typeName = getZodTypeNameFromSchema(schema);
  nn(typeName, 'Invalid schema');

  return typeName === ZodTypeName.ZodDefault;
}

export function isZodBoolean(schema: unknown): schema is zod.ZodBoolean {
  const typeName = getZodTypeNameFromSchema(schema);
  nn(typeName, 'Invalid schema');

  return typeName === ZodTypeName.ZodBoolean;
}

export function isZodEffects(schema: unknown): schema is zod.ZodEffects<any> {
  const typeName = getZodTypeNameFromSchema(schema);
  nn(typeName, 'Invalid schema');

  return typeName === ZodTypeName.ZodEffects;
}

export function isZodDate(schema: unknown): schema is zod.ZodDate {
  const typeName = getZodTypeNameFromSchema(schema);
  nn(typeName, 'Invalid schema');

  return typeName === ZodTypeName.ZodDate;
}
