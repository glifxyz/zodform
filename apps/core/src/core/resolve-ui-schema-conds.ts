import { isNil } from 'lodash-es';
import { isValidElement } from 'react';
import type { AnyZodObject } from 'zod';
import { componentNameDeserialize } from './component-name-deserialize';
import type { ComponentPath, FormUiSchema } from './form';

function extractCondsFromUiSchema(uiSchema: FormUiSchema<AnyZodObject>) {
  const conds: Record<string, boolean | ((formData: any) => boolean)> = {};

  function traverse(uiSchema: FormUiSchema<AnyZodObject>, path: ComponentPath = []): void {
    for (const key in uiSchema) {
      const value = uiSchema[key];

      // Skip React elements as no cond will be found traversing those
      if (isNil(value) || isValidElement(value)) {
        continue;
      }

      if (typeof value === 'object') {
        if ('ui' in value) {
          const name = [...path, key].join('.');
          if (value.ui?.cond) {
            conds[name] = value.ui.cond;
          }
        }

        if (key === 'element') {
          // If it's the array's element property
          // @ts-expect-error incorrect type, TODO
          traverse(value, path);
        } else if (key === 'elements') {
          // If it's the discriminatedUnion's `elements` property
          //
          // In this case, we iterate over the properties of `elements`
          // and traverse each one, but we do NOT add the element name
          // to the path, because the element name is not part of the
          // form data's path. The form data's path is just the array's path.

          for (const elementKey in value) {
            // @ts-expect-error incorrect type, TODO
            const elementValue = value[elementKey];
            if (typeof elementValue === 'object' && !isNil(elementValue) && !isValidElement(elementValue)) {
              traverse(elementValue, path);
            }
          }
        } else if (key !== 'ui') {
          // If it's the object's ui property
          // @ts-expect-error incorrect type, TODO
          traverse(value, [...path, key]);
        }
      } else if (key === 'cond') {
        conds[path.join('.')] = value;
      }
    }
  }

  traverse(uiSchema);

  return conds;
}

export type CondResult = {
  path: ComponentPath;
  cond: boolean;
};

/**
 * UiSchema specifies a `cond` property, which determines
 * whether the field should be shown in the form or not.
 *
 * This function runs all `cond` functions and defines
 * a mapping from the property path to a boolean value.
 * */
export function resolveUiSchemaConds({
  uiSchema,
  formData
}: {
  formData: Record<string, any>;
  uiSchema: FormUiSchema<any>;
}): CondResult[] {
  const result = extractCondsFromUiSchema(uiSchema);
  return Object.entries(result).map(([path, cond]) => ({
    // TODO: add metadata for array index etc, so array items can know their position
    cond: typeof cond === 'boolean' ? cond : cond(formData),
    path: componentNameDeserialize(path)
  }));
}
