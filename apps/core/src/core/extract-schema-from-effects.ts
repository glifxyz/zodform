import { type FormSchema } from './form';
import { type ZodDiscriminatedUnion, type AnyZodObject, type ZodEffects } from 'zod';

export type ExtractSchemaFromEffects<
  Schema extends FormSchema,
  Extracted = _Recurse<InferInnerType<Schema>>
> = Extracted extends {
  __rec: infer U;
}
  ? // If it actually recursed, then we need to extract the inner type
    U
  : // If it was AnyZodObject, no recursion happened, so we can just return the type
    Extracted;

type InferInnerType<Schema extends FormSchema> = Schema extends AnyZodObject
  ? Schema
  : Schema extends ZodDiscriminatedUnion<any, any>
    ? Schema
    : Schema extends ZodEffects<infer InnerSchema extends FormSchema>
      ? { __rec: InferInnerType<InnerSchema> }
      : never;

type _Recurse<T> = T extends { __rec: never }
  ? never
  : T extends { __rec: { __rec: infer U } }
    ? { __rec: _Recurse<U> }
    : T extends { __rec: infer U }
      ? U
      : T;
