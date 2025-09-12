import { cloneDeep, flatten, groupBy, head, isNil, noop, omit, set, values } from 'lodash-es';
import {
  memo,
  createContext as reactCreateContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState
} from 'react';
import { type PartialDeep } from 'type-fest';
import type * as zod from 'zod';
import type {
  AnyZodObject,
  ZodArray,
  ZodBoolean,
  ZodDate,
  ZodDefault,
  ZodDiscriminatedUnion,
  ZodDiscriminatedUnionOption,
  ZodEffects,
  ZodEnum,
  ZodFirstPartySchemaTypes,
  ZodLiteral,
  ZodNumber,
  ZodObject,
  ZodOptional,
  ZodRawShape,
  ZodString
} from 'zod';
import { z } from 'zod';
import { ArrayDefault, type IArrayDefaultProps } from '../components/default/array-default';
import { BooleanDefault, type IBooleanDefaultProps } from '../components/default/boolean-default';
import { DateDefault, type IDateDefaultProps } from '../components/default/date-default';
import { EnumDefault, type IEnumDefaultProps } from '../components/default/enum-default';
import {
  type IMultiChoiceDefaultProps,
  MultiChoiceDefault
} from '../components/default/multi-choice-default';
import { type INumberDefaultProps, NumberDefault } from '../components/default/number-default';
import { type IObjectDefaultProps, ObjectDefault } from '../components/default/object-default';
import { type IStringDefaultProps, StringDefault } from '../components/default/string-default';
import { type IComponentProps } from '../components/types';
import { createContext } from '../utils/create-context';
import { unset } from '../utils/unset';
import { useUncontrolledToControlledWarning } from '../utils/use-uncontrolled-to-controlled-warning';
import { componentNameDeserialize, componentNameSerialize } from './component-name-deserialize';
import { type ExtractSchemaFromEffects } from './extract-schema-from-effects';
import { formDefaultValueFromSchema } from './form-default-value-from-schema';
import { mergeZodOuterInnerType } from './merge-zod-outer-inner-type';
import { type CondResult, resolveUiSchemaConds } from './resolve-ui-schema-conds';
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
  isZodString,
  type ZodAnyArray,
  type ZodAnyEnum
} from './schema-type-resolvers';

/**
 * Simple implementation of Immer's produce function using lodash
 */
export function produce<T>(baseState: T, recipe: (draft: T) => void | T): T {
  // Create a deep copy of the base state
  const draft = cloneDeep(baseState);

  // Apply the recipe to the draft
  const result = recipe(draft);

  // If recipe returns something, use that; otherwise use the mutated draft
  return result !== undefined ? result : draft;
}

function zodSchemaDescription(schema: ZodFirstPartySchemaTypes) {
  return schema._def.description;
}

type ComponentName = string;
type ErrorsMap = Record<ComponentName, zod.ZodIssue[]>;
export type ComponentPath = (string | number)[];

type ChangeOp = 'update' | 'remove' | 'array-add' | 'array-remove';
type ChangePayload =
  | {
      op: Extract<ChangeOp, 'update'>;
      value: any;
      path: ComponentPath;
    }
  | {
      op: Extract<ChangeOp, 'remove'>;
      path: ComponentPath;
    }
  | {
      op: Extract<ChangeOp, 'array-add'>;
      value: any;
      path: ComponentPath;
    }
  | {
      op: Extract<ChangeOp, 'array-remove'>;
      path: ComponentPath;
    };
type OnChange = (data: ChangePayload) => void;

const [useInternalFormContext, FormContextProvider] = createContext<{
  errors?: ErrorsMap;
  components?: Required<IFormProps<any>>['components'];

  onChange: OnChange;
  conds: FormConds;
}>();

const FormContext = reactCreateContext<{
  value: any;
  update: (updater: (value: any) => void) => void;
}>({
  value: {},
  update: noop
});

export function useForm<Schema extends FormSchema>(): {
  value: FormValue<Schema>;
  update: (updater: (value: FormValue<Schema>) => void) => void;
} {
  return useContext(FormContext);
}

function isComponentVisible(name: string, conds: FormConds): boolean {
  return conds[name]?.cond ?? true;
}

function useComponent(name: string): {
  errors: zod.ZodIssue[];
  isVisible: boolean;
} {
  const { errors, conds } = useInternalFormContext();

  return useMemo(() => {
    return {
      errors: errors?.[name] ?? [],
      isVisible: isComponentVisible(name, conds)
    };
  }, [conds, errors, name]);
}

/**
 * Extract the properties which should be available to any leaf component
 * (string, number, boolean, enum, etc.)
 * */
function getLeafPropsFromUiSchema(
  // We don't care about the type of "component", since we'll omit it anyway
  uiProps?: Omit<UiPropertiesBaseNew<ZodFirstPartySchemaTypes, any>, 'Component'> & {
    Component?: any;
  }
) {
  return omit(uiProps ?? {}, ['Component', 'cond']);
}

interface IZodLeafComponentProps<Schema extends ZodFirstPartySchemaTypes, Value> {
  schema: Schema;
  name: string;
  description?: ReactNode;
  isRequired: boolean;
  value?: Value;
}

interface IZodInnerComponentProps {
  onChange: OnChange;
  components: IFormProps<any>['components'];
  errorMessage?: string;
}

interface IZodStringComponentProps extends IZodLeafComponentProps<ZodString, string> {
  uiSchema?: UiPropertiesString<any>;
}

const ZodStringComponentInner = memo(function ZodStringComponentInner({
  name,
  schema,
  value,
  isRequired,
  uiSchema,

  onChange,
  components,
  errorMessage
}: IZodStringComponentProps & IZodInnerComponentProps) {
  const handleChange = useCallback(
    function handleChange(value = '') {
      // TODO: decide if we want to remove empty strings or not?
      // it should be up to the consumer to decide, otherwise they just get an empty object as the diff
      const isEmpty = value === '';
      if (isEmpty && !isRequired) {
        return onChange({
          op: 'remove',
          path: componentNameDeserialize(name)
        });
      }

      return onChange({
        op: 'update',
        value,
        path: componentNameDeserialize(name)
      });
    },
    [name, isRequired, onChange]
  );

  const Component = uiSchema?.Component ?? components?.string ?? StringDefault;

  return (
    <Component
      value={value}
      onChange={handleChange}
      name={name}
      label={uiSchema?.label ?? name}
      description={zodSchemaDescription(schema)}
      errorMessage={errorMessage}
      isRequired={isRequired}
      placeholder={uiSchema?.placeholder}
      {...getLeafPropsFromUiSchema(uiSchema)}
    />
  );
});

function ZodStringComponent(props: IZodStringComponentProps) {
  const { onChange, components } = useInternalFormContext();
  const { errors, isVisible } = useComponent(props.name);

  if (!isVisible) {
    return null;
  }

  return (
    <ZodStringComponentInner
      {...props}
      errorMessage={head(errors)?.message}
      onChange={onChange}
      components={components}
    />
  );
}

interface IZodEnumComponentProps extends IZodLeafComponentProps<ZodAnyEnum, string> {
  uiSchema?: UiPropertiesEnum<any, any>;
}

const ZodEnumComponentInner = memo(function ZodEnumComponentInner({
  schema,
  name,
  value = '',
  isRequired,
  uiSchema,

  components,
  onChange,
  errorMessage
}: IZodEnumComponentProps & IZodInnerComponentProps) {
  const handleChange = useCallback(
    function handleChange(value = '') {
      const isEmpty = value === '';

      if (isEmpty) {
        return onChange({
          op: 'remove',
          path: componentNameDeserialize(name)
        });
      }

      return onChange({
        op: 'update',
        value,
        path: componentNameDeserialize(name)
      });
    },
    [name, onChange]
  );

  const Component = uiSchema?.Component ?? components?.enum ?? EnumDefault;

  return (
    <Component
      options={schema._def.values}
      errorMessage={errorMessage}
      label={uiSchema?.label ?? name}
      name={name}
      description={zodSchemaDescription(schema)}
      onChange={handleChange}
      value={value}
      isRequired={isRequired}
      {...getLeafPropsFromUiSchema(uiSchema)}
    />
  );
});

function ZodEnumComponent(props: IZodEnumComponentProps) {
  const { onChange, components } = useInternalFormContext();
  const { errors, isVisible } = useComponent(props.name);

  if (!isVisible) {
    return null;
  }

  return (
    <ZodEnumComponentInner
      {...props}
      components={components}
      onChange={onChange}
      errorMessage={head(errors)?.message}
    />
  );
}

interface IZodNumberComponentProps extends IZodLeafComponentProps<zod.ZodNumber, number> {
  uiSchema?: UiPropertiesBaseNew<ZodNumber, any>;
}

const ZodNumberComponentInner = memo(function ZodNumberComponentInner({
  name,
  schema,
  value,
  isRequired,
  uiSchema,

  onChange,
  components,
  errorMessage
}: IZodNumberComponentProps & IZodInnerComponentProps) {
  const handleChange = useCallback(
    function handleChange(value?: number) {
      const isEmpty = isNil(value) || Number.isNaN(value);

      if (isEmpty) {
        return onChange({
          op: 'remove',
          path: componentNameDeserialize(name)
        });
      }

      return onChange({
        op: 'update',
        value,
        path: componentNameDeserialize(name)
      });
    },
    [name, onChange]
  );

  const Component = uiSchema?.Component ?? components?.number ?? NumberDefault;

  return (
    <Component
      value={value}
      onChange={handleChange}
      name={name}
      label={uiSchema?.label ?? name}
      description={zodSchemaDescription(schema)}
      errorMessage={errorMessage}
      isRequired={isRequired}
      min={schema.minValue ?? schema._def.checks.find((c) => c.kind === 'min')?.value ?? undefined}
      max={schema.maxValue ?? schema._def.checks.find((c) => c.kind === 'max')?.value ?? undefined}
      step={schema._def.checks.find((c) => c.kind === 'multipleOf')?.value ?? undefined}
      {...getLeafPropsFromUiSchema(uiSchema)}
    />
  );
});

function ZodNumberComponent(props: IZodNumberComponentProps) {
  const { onChange, components } = useInternalFormContext();
  const { errors, isVisible } = useComponent(props.name);

  if (!isVisible) {
    return null;
  }

  return (
    <ZodNumberComponentInner
      {...props}
      errorMessage={head(errors)?.message}
      onChange={onChange}
      components={components}
    />
  );
}
interface IZodBooleanComponentProps extends IZodLeafComponentProps<zod.ZodBoolean, boolean> {
  uiSchema?: UiPropertiesBaseNew<ZodBoolean, any>;
}

const ZodBooleanComponentInner = memo(function ZodBooleanComponentInner({
  name,
  schema,
  value,
  isRequired,
  uiSchema,

  onChange,
  components,
  errorMessage
}: IZodBooleanComponentProps & IZodInnerComponentProps) {
  const handleChange = useCallback(
    function handleChange(value: boolean) {
      onChange({
        op: 'update',
        value,
        path: componentNameDeserialize(name)
      });
    },
    [name, onChange]
  );

  const Component = uiSchema?.Component ?? components?.boolean ?? BooleanDefault;

  return (
    <Component
      value={value}
      onChange={handleChange}
      name={name}
      label={uiSchema?.label ?? name}
      description={zodSchemaDescription(schema)}
      errorMessage={errorMessage}
      isRequired={isRequired}
      {...getLeafPropsFromUiSchema(uiSchema)}
    />
  );
});

function ZodBooleanComponent(props: IZodBooleanComponentProps) {
  const { onChange, components } = useInternalFormContext();
  const { errors, isVisible } = useComponent(props.name);

  if (!isVisible) {
    return null;
  }

  return (
    <ZodBooleanComponentInner
      {...props}
      components={components}
      errorMessage={head(errors)?.message}
      onChange={onChange}
    />
  );
}

interface IZodDateComponentProps extends IZodLeafComponentProps<zod.ZodDate, Date> {
  uiSchema?: UiPropertiesBaseNew<ZodDate, any>;
}

const ZodDateComponentInner = memo(function ZodDateComponentInner({
  name,
  schema,
  value,
  isRequired,
  uiSchema,

  onChange,
  components,
  errorMessage
}: IZodDateComponentProps & IZodInnerComponentProps) {
  const handleChange = useCallback(
    function handleChange(value: Date | undefined) {
      onChange({
        op: 'update',
        value,
        path: componentNameDeserialize(name)
      });
    },
    [name, onChange]
  );

  const Component = uiSchema?.Component ?? components?.date ?? DateDefault;

  return (
    <Component
      value={value}
      onChange={handleChange}
      name={name}
      label={uiSchema?.label ?? name}
      description={zodSchemaDescription(schema)}
      errorMessage={errorMessage}
      isRequired={isRequired}
      {...getLeafPropsFromUiSchema(uiSchema)}
    />
  );
});

function ZodDateComponent(props: IZodDateComponentProps) {
  const { onChange, components } = useInternalFormContext();
  const { errors, isVisible } = useComponent(props.name);

  if (!isVisible) {
    return null;
  }

  return (
    <ZodDateComponentInner
      {...props}
      components={components}
      errorMessage={head(errors)?.message}
      onChange={onChange}
    />
  );
}

interface IZodArrayComponentProps extends IZodLeafComponentProps<ZodAnyArray, any[]> {
  minLength?: number;
  maxLength?: number;
  exactLength?: number;
  uiSchema?: UiPropertiesArray<any, any> | UiPropertiesMultiChoice<ZodEnum<any>, any>;
}

const ZodArrayMultiChoiceComponent = memo(function ZodArrayMultiChoiceComponent({
  schema,
  name,
  value = [],
  uiSchema,

  onChange,
  components,
  errorMessage
}: IZodArrayComponentProps & IZodInnerComponentProps) {
  const uiProps = (uiSchema ?? {}) as UiPropertiesMultiChoice<ZodEnum<any>, any>;
  const Component = uiProps.Component ?? components?.multiChoice ?? MultiChoiceDefault;

  return (
    <Component
      {...uiProps}
      label={uiProps.label ?? name}
      name={name}
      errorMessage={errorMessage}
      onChange={(newValue) => {
        onChange({
          op: 'update',
          path: componentNameDeserialize(name),
          value: newValue
        });
      }}
      value={value}
      options={schema._def.type.options}
    />
  );
});

function ZodArrayComponent(props: IZodArrayComponentProps) {
  const { onChange, components } = useInternalFormContext();
  const { errors, isVisible } = useComponent(props.name);

  const { schema, name, value, uiSchema } = props;
  const arraySchemaElement = schema._def.type;

  if (!isVisible) {
    return null;
  }

  if (isZodEnum(arraySchemaElement)) {
    return (
      <ZodArrayMultiChoiceComponent
        {...props}
        onChange={onChange}
        components={components}
        errorMessage={head(errors)?.message}
      />
    );
  }

  const uiProps = (uiSchema ?? {}) as UiPropertiesArray<any, any>;
  const Component = uiProps.Component ?? components?.array ?? ArrayDefault;

  return (
    <Component
      description={uiProps.description ?? zodSchemaDescription(schema)}
      title={uiProps.title ?? name}
      onRemove={(index) => {
        onChange({
          op: 'array-remove',
          path: componentNameDeserialize(`${name}[${index}]`)
        });
      }}
      onAdd={(newValue: unknown) => {
        onChange({
          op: 'array-add',
          path: componentNameDeserialize(`${name}[${value?.length ?? 0}]`),
          value: newValue ?? formDefaultValueFromSchema(arraySchemaElement)
        });
      }}
    >
      {value?.map((item, index) => {
        const uniqueName = `${name}[${index}]`;
        return (
          <ZodAnyComponent
            key={uniqueName}
            name={uniqueName}
            schema={arraySchemaElement}
            value={item}
            uiSchema={uiProps.element}
          />
        );
      }) ?? []}
    </Component>
  );
}

function ZodObjectComponent({
  value,
  schema,
  name,
  uiSchema
}: {
  value: any;
  schema: AnyZodObject;
  uiSchema?: UiPropertiesObject<any, any>;
  name?: string;
}) {
  const { isVisible } = useComponent(name ?? '');
  const { components, onChange } = useInternalFormContext();

  const handleChange = useCallback(
    (updater: (old: any) => any) => {
      if (name) {
        onChange({
          op: 'update',
          path: componentNameDeserialize(name),
          value: updater(value)
        });
      }
    },
    [name, onChange, value]
  );

  const formChildren = (function () {
    const result = Object.entries(schema._def.shape()).map(([thisName, thisSchema]) => {
      const childName = name ? [name, thisName].join('.') : thisName;

      return {
        name: thisName,
        component: (
          <ZodAnyComponent
            key={childName}
            name={childName}
            schema={thisSchema as ZodFirstPartySchemaTypes}
            value={value ? value[thisName] : undefined}
            uiSchema={uiSchema ? uiSchema[thisName] : undefined}
          />
        )
      };
    });

    if (uiSchema?.ui?.Layout) {
      const children: Record<string, ReactNode> = {};
      for (const { name, component } of result) {
        children[name] = component;
      }
      return uiSchema.ui.Layout({ children, value, onChange: handleChange });
    }

    return result.map(({ component }) => component);
  })();

  if (!isVisible) {
    return null;
  }

  // Don't create a div as the first child of the form
  if (isNil(name)) {
    return <>{formChildren}</>;
  }

  const Component = uiSchema?.ui?.Component ?? components?.object ?? ObjectDefault;

  return (
    <Component
      onChange={handleChange}
      value={value}
      description={zodSchemaDescription(schema) ?? uiSchema?.ui?.description}
      {...omit(uiSchema?.ui ?? {}, ['Component'])}
    >
      {formChildren}
    </Component>
  );
}

interface IZodDiscriminatedUnionComponentProps<
  TDiscriminator extends string,
  TOptions extends ZodDiscriminatedUnionOption<TDiscriminator>[]
> {
  value: any;
  schema: zod.ZodDiscriminatedUnion<TDiscriminator, TOptions>;
  name?: string;
  uiSchema?: UiPropertiesDiscriminatedUnion<zod.ZodDiscriminatedUnion<TDiscriminator, TOptions>, any>;
}

function ZodDiscriminatedUnionComponent<
  TDiscriminator extends string,
  TOptions extends ZodDiscriminatedUnionOption<TDiscriminator>[]
>({ schema, name, value, uiSchema }: IZodDiscriminatedUnionComponentProps<TDiscriminator, TOptions>) {
  // 1. generate a z.enum for the discriminator, and render a select box
  // 2. if the discriminator has a value, render the corresponding component

  const discriminator = schema._def.discriminator;

  // TODO: expects a literal, but realistically it could be anything
  // for now we'll just throw on non-literals, but we should support more types
  const options = schema.options.map((optionSchema) => {
    const option = optionSchema.shape[discriminator];
    if (!isZodLiteral(option)) {
      throw new Error('Discriminator must be a literal');
    }
    return option.value;
  });

  const enumForDiscriminator = z.enum(options as [any, ...any[]]) as ZodAnyEnum;
  const nameForDiscriminator = [name, discriminator].filter(Boolean).join('.');
  const valueForDiscriminator = value?.[discriminator];

  const schemaForDiscriminatedValue = schema.options.find((optionSchema) => {
    const option = optionSchema.shape[discriminator];
    if (!isZodLiteral(option)) {
      throw new Error('Discriminator must be a literal');
    }

    return valueForDiscriminator && option.value === valueForDiscriminator;
  });

  const uiSchemaForDiscriminatedValue =
    uiSchema?.elements?.[valueForDiscriminator as keyof typeof uiSchema.elements];

  return (
    <>
      {uiSchema?.title && <h3 className="mb-2 text-lg font-semibold">{uiSchema.title}</h3>}
      <ZodEnumComponent
        uiSchema={{
          label: uiSchema?.discriminator?.label ?? nameForDiscriminator,
          optionLabels: enumForDiscriminator._def.values.reduce(
            (acc, value) => {
              const optionLabel =
                uiSchema?.elements?.[value as keyof typeof uiSchema.elements]?.ui?.optionLabel;

              if (!optionLabel) {
                return acc;
              }

              return {
                ...acc,
                [value]: optionLabel
              };
            },
            {} as Record<string, string>
          )
        }}
        schema={enumForDiscriminator}
        name={nameForDiscriminator}
        isRequired
        description={discriminator}
        value={value?.[discriminator]}
      />

      {schemaForDiscriminatedValue && (
        <ZodAnyComponent
          uiSchema={uiSchemaForDiscriminatedValue}
          value={value}
          schema={schemaForDiscriminatedValue}
          name={name}
        />
      )}
    </>
  );
}

const ZodAnyComponent = memo(function ZodAnyComponent({
  schema,
  name,
  isRequired = true,
  value,
  uiSchema
}: {
  schema: ZodFirstPartySchemaTypes;
  name?: string;
  isRequired?: boolean;
  value?: any;
  uiSchema?: any;
}) {
  if (isZodObject(schema)) {
    return <ZodObjectComponent uiSchema={uiSchema} value={value} schema={schema} name={name} />;
  }

  if (isZodDiscriminatedUnion(schema)) {
    return <ZodDiscriminatedUnionComponent uiSchema={uiSchema} schema={schema} name={name} value={value} />;
  }

  if (isNil(name)) {
    return null;
  }

  if (isZodString(schema)) {
    return (
      <ZodStringComponent
        uiSchema={uiSchema}
        schema={schema}
        name={name}
        isRequired={isRequired}
        value={value}
      />
    );
  }

  if (isZodEnum(schema)) {
    return (
      <ZodEnumComponent
        uiSchema={uiSchema}
        value={value}
        schema={schema}
        name={name}
        isRequired={isRequired}
      />
    );
  }

  if (isZodBoolean(schema)) {
    return (
      <ZodBooleanComponent
        uiSchema={uiSchema}
        schema={schema}
        name={name}
        isRequired={isRequired}
        value={value}
      />
    );
  }

  if (isZodArray(schema)) {
    const { minLength, maxLength, exactLength, description } = schema._def;

    return (
      <ZodArrayComponent
        uiSchema={uiSchema}
        schema={schema}
        name={name}
        isRequired={isRequired}
        exactLength={exactLength?.value}
        maxLength={maxLength?.value}
        minLength={minLength?.value}
        description={description}
        value={value}
      />
    );
  }

  if (isZodNumber(schema)) {
    return (
      <ZodNumberComponent
        uiSchema={uiSchema}
        schema={schema}
        name={name}
        isRequired={isRequired}
        value={value}
      />
    );
  }

  if (isZodOptional(schema) || isZodNullable(schema)) {
    return (
      <ZodAnyComponent
        uiSchema={uiSchema}
        schema={mergeZodOuterInnerType(schema)}
        name={name}
        isRequired={false}
        value={value}
      />
    );
  }

  if (isZodDefault(schema)) {
    return (
      <ZodAnyComponent
        uiSchema={uiSchema}
        schema={mergeZodOuterInnerType(schema)}
        name={name}
        isRequired={isRequired}
        value={value}
      />
    );
  }

  if (isZodDate(schema)) {
    return (
      <ZodDateComponent
        uiSchema={uiSchema}
        schema={schema}
        name={name}
        isRequired={isRequired}
        value={value}
      />
    );
  }

  if (isZodEffects(schema)) {
    return (
      <ZodAnyComponent
        uiSchema={uiSchema}
        schema={mergeZodOuterInnerType(schema)}
        name={name}
        isRequired={isRequired}
        value={value}
      />
    );
  }

  return null;
});

type ResolveComponentPropsFromSchema<Schema> = Schema extends ZodString
  ? IStringDefaultProps
  : Schema extends ZodNumber
    ? INumberDefaultProps
    : Schema extends ZodBoolean
      ? IBooleanDefaultProps
      : Schema extends ZodDate
        ? IDateDefaultProps
        : Schema extends ZodObject<any>
          ? IObjectDefaultProps & UiPropertiesObjectValue<Schema>
          : Schema extends ZodEnum<any>
            ? IEnumDefaultProps
            : Schema extends ZodArray<infer ItemSchema>
              ? ItemSchema extends ZodEnum<any>
                ? IMultiChoiceDefaultProps
                : IArrayDefaultProps
              : never;

type UiPropertiesBaseNew<Schema, RootSchema extends object> = {
  label?: ReactNode;
  Component?: (props: ResolveComponentPropsFromSchema<Schema>) => ReactNode;
  cond?: (data: PartialDeep<RootSchema>) => boolean;
  description?: ReactNode;
};

type UiPropertiesString<RootSchema extends object> = UiPropertiesBaseNew<ZodString, RootSchema> & {
  placeholder?: string;
};

type UiPropertiesEnum<Schema extends ZodEnum<any>, RootSchema extends object> = UiPropertiesBaseNew<
  Schema,
  RootSchema
> & {
  optionLabels?: Record<zod.infer<Schema>, string>;
};

type UiPropertiesMultiChoice<Schema extends ZodEnum<any>, RootSchema extends object> = Omit<
  UiPropertiesEnum<Schema, RootSchema>,
  'Component'
> & {
  Component?: (props: IMultiChoiceDefaultProps) => ReactNode;
};

// These are the properties for non-leaf nodes such as array, object
type UiPropertiesCompoundInner<RootSchema extends object> = {
  title?: ReactNode;
  description?: ReactNode;
  cond?: (data: PartialDeep<RootSchema>) => boolean;
};

export type UiPropertiesCompound<RootSchema extends object> = Omit<
  UiPropertiesCompoundInner<RootSchema>,
  'cond'
>;

type UiPropertiesObjectValue<Schema extends AnyZodObject> = {
  value: Partial<zod.infer<Schema>>;
  onChange: (updater: (old: Partial<zod.infer<Schema>>) => Partial<zod.infer<Schema>>) => void;
};

type UiPropertiesObject<Schema extends AnyZodObject, RootSchema extends object> = Partial<
  UiSchema<Schema, RootSchema>
> & {
  ui?: UiPropertiesCompoundInner<RootSchema> & {
    Layout?: (
      props: {
        children: Record<keyof zod.infer<Schema>, ReactNode>;
      } & UiPropertiesObjectValue<Schema>
    ) => ReactNode;
    Component?: (props: ResolveComponentPropsFromSchema<Schema>) => ReactNode;
  };
};

/**
 * Arrays should allow for modifying the element type's ui schema too.
 * So, we do that through the `element` property.
 * */
type UiPropertiesArray<Schema extends ZodArray<any>, RootSchema extends object> = (Schema extends ZodArray<
  infer El extends AnyZodObject
>
  ? {
      element?: Omit<UiPropertiesObject<El, RootSchema>, 'ui'> & {
        ui?: Omit<Required<UiPropertiesObject<El, RootSchema>>['ui'], 'cond'>;
      };
    }
  : Schema extends ZodArray<ZodString>
    ? { element?: Omit<UiPropertiesString<RootSchema>, 'cond'> }
    : { element?: Omit<UiPropertiesBaseNew<Schema, RootSchema>, 'cond'> }) &
  (UiPropertiesCompoundInner<RootSchema> & {
    Component?: (props: IArrayDefaultProps) => ReactNode;
  });

type ResolveArrayUiSchema<Schema extends ZodArray<any>, RootSchema extends object> =
  Schema extends ZodArray<infer El>
    ? El extends ZodEnum<any>
      ? UiPropertiesMultiChoice<El, RootSchema>
      : UiPropertiesArray<Schema, RootSchema>
    : never;

type ExtractDiscriminatedUnionLiteralValues<
  Discriminator extends string,
  Options extends readonly ZodDiscriminatedUnionOption<Discriminator>[]
> = {
  [K in keyof Options]: Options[K] extends ZodObject<infer Shape extends ZodRawShape>
    ? Shape[Discriminator] extends ZodLiteral<infer Value>
      ? Value
      : never
    : never;
}[number];

type GetDiscriminatedUnionOptionForLiteral<
  Discriminator extends string,
  Options extends readonly ZodDiscriminatedUnionOption<Discriminator>[],
  Literal extends string | number | boolean
> = Options[number] extends infer Option
  ? Option extends ZodObject<infer Shape>
    ? Shape[Discriminator] extends ZodLiteral<Literal>
      ? Option
      : never
    : never
  : never;

type UiSchemaForDiscriminatedUnionOption<
  Discriminator extends string,
  Option extends ZodObject<any>,
  RootSchema extends object
> =
  Option extends ZodObject<infer Shape>
    ? UiSchemaZodTypeResolver<
        ZodObject<{
          [K in keyof Shape as K extends Discriminator ? never : K]: Shape[K] & {
            select?: string;
          };
        }>,
        RootSchema
      >
    : never;

type UiPropertiesDiscriminatedUnion<
  Schema extends ZodDiscriminatedUnion<any, any>,
  RootSchema extends object
> =
  Schema extends ZodDiscriminatedUnion<infer Discriminator extends string, infer Options>
    ? {
        title?: string;
        discriminator?: Omit<UiPropertiesBaseNew<Schema, RootSchema>, 'cond'>;
        elements?: {
          [K in ExtractDiscriminatedUnionLiteralValues<
            Discriminator,
            Options
          >]?: UiSchemaForDiscriminatedUnionOption<
            Discriminator,
            GetDiscriminatedUnionOptionForLiteral<Discriminator, Options, K>,
            RootSchema
          > & {
            ui?: {
              optionLabel?: ReactNode;
            };
          };
        };
      } & UiPropertiesCompoundInner<RootSchema> & {
          Component?: (props: IArrayDefaultProps) => ReactNode;
        }
    : never;

type OmitComponentProps<T extends IComponentProps<any>> = Omit<T, keyof IComponentProps<any>>;

type UiSchemaZodTypeResolver<Schema extends ZodFirstPartySchemaTypes, RootSchema extends object> =
  Schema extends ZodEffects<infer Inner, any, any>
    ? UiSchemaZodTypeResolver<Inner, RootSchema>
    : Schema extends ZodOptional<infer Inner> | zod.ZodNullable<infer Inner> | ZodDefault<infer Inner>
      ? UiSchemaZodTypeResolver<Inner, RootSchema>
      : Schema extends ZodDate
        ? UiPropertiesBaseNew<Schema, RootSchema> & OmitComponentProps<IDateDefaultProps>
        : Schema extends ZodBoolean
          ? UiPropertiesBaseNew<Schema, RootSchema> & OmitComponentProps<IBooleanDefaultProps>
          : Schema extends ZodObject<any>
            ? UiPropertiesObject<Schema, RootSchema> & Omit<IObjectDefaultProps, 'children'>
            : Schema extends ZodArray<any>
              ? ResolveArrayUiSchema<Schema, RootSchema> &
                  Omit<IArrayDefaultProps, 'onAdd' | 'onRemove' | 'children'>
              : Schema extends ZodDiscriminatedUnion<any, any>
                ? UiPropertiesDiscriminatedUnion<Schema, RootSchema> & Omit<IObjectDefaultProps, 'children'>
                : Schema extends ZodEnum<any>
                  ? UiPropertiesEnum<Schema, RootSchema> &
                      Omit<OmitComponentProps<IEnumDefaultProps>, 'options'>
                  : Schema extends ZodString
                    ? UiPropertiesString<RootSchema> & OmitComponentProps<IStringDefaultProps>
                    : Schema extends ZodNumber
                      ? UiPropertiesBaseNew<Schema, RootSchema> & OmitComponentProps<INumberDefaultProps>
                      : UiPropertiesBaseNew<Schema, RootSchema>;

type UiSchema<
  Schema extends FormSchema,
  RootSchema extends object,
  ExtractedSchema = ExtractSchemaFromEffects<Schema>
> = ExtractedSchema extends AnyZodObject
  ? {
      [K in keyof ExtractedSchema['shape']]: UiSchemaZodTypeResolver<ExtractedSchema['shape'][K], RootSchema>;
    }
  : ExtractedSchema extends ZodDiscriminatedUnion<infer Discriminator extends string, infer Options>
    ? {
        title?: string;
        discriminator?: Omit<UiPropertiesBaseNew<Schema, RootSchema>, 'cond'>;
        elements?: {
          [K in ExtractDiscriminatedUnionLiteralValues<
            Discriminator,
            Options
          >]?: UiSchemaForDiscriminatedUnionOption<
            Discriminator,
            GetDiscriminatedUnionOptionForLiteral<Discriminator, Options, K>,
            RootSchema
          > & {
            ui?: {
              optionLabel?: ReactNode;
            };
          };
        };
      }
    : ExtractedSchema;

export type FormUiSchema<Schema extends FormSchema> = Partial<UiSchema<Schema, zod.infer<Schema>>>;

export type FormValue<Schema extends FormSchema> = PartialDeep<zod.infer<Schema>>;
export type FormSchema = AnyZodObject | ZodDiscriminatedUnion<any, any> | ZodEffects<any>;

type UncontrolledFormOnChange<Schema extends FormSchema> = (changeEvent: {
  change: ChangePayload;
  patch: FormValue<Schema>;
  formData: FormValue<Schema>;
}) => void;

type ControlledFormOnChange<Schema extends FormSchema> = (
  updater: (oldValue: FormValue<Schema>) => FormValue<Schema>
) => void;

type FormChildren = (props: { errors: zod.ZodIssue[] }) => ReactNode;
type FormConds = Record<string, CondResult>;

type IBaseFormProps<Schema extends FormSchema> = {
  schema: Schema;
  uiSchema?: FormUiSchema<Schema>;
  onSubmit?: (value: zod.infer<Schema>) => void;

  defaultValues?: zod.infer<Schema>;
  components?: {
    string?: (props: IStringDefaultProps) => ReactNode;
    number?: (props: INumberDefaultProps) => ReactNode;
    enum?: (props: IEnumDefaultProps) => ReactNode;
    boolean?: (props: IBooleanDefaultProps) => ReactNode;
    object?: (props: IObjectDefaultProps) => ReactNode;
    array?: (props: IArrayDefaultProps) => ReactNode;
    multiChoice?: (props: IMultiChoiceDefaultProps) => ReactNode;
    date?: (props: IDateDefaultProps) => ReactNode;
  };
  title?: ReactNode;
  children?: FormChildren;
  liveValidate?: boolean;
  onErrorsChange?: (errors: zod.ZodIssue[]) => void;
  className?: string;

  showSubmitButton?: boolean;
};

type IUncontrolledFormProps<Schema extends FormSchema> = {
  onChange?: UncontrolledFormOnChange<Schema>;
  value?: never;
} & IBaseFormProps<Schema>;

type IControlledFormProps<Schema extends FormSchema> = {
  onChange?: ControlledFormOnChange<Schema>;
  value: FormValue<Schema>;
} & IBaseFormProps<Schema>;

type IFormProps<Schema extends FormSchema> = IUncontrolledFormProps<Schema> | IControlledFormProps<Schema>;

/**
 * Zod may wrap the schema in an effects
 * object (when using refine, for example)
 * so we need to resolve the schema to the actual
 * object schema from which we can generate the form
 * */
function resolveObjectSchema(schema: FormSchema): AnyZodObject | ZodDiscriminatedUnion<any, any> {
  if (isZodObject(schema)) {
    return schema;
  }

  if (isZodDiscriminatedUnion(schema)) {
    return schema;
  }

  if (isZodEffects(schema)) {
    return resolveObjectSchema(schema._def.schema);
  }

  throw new Error(`Schema must be an object, got ${schema}`);
}

function resolveNextFormConds(formData: any, uiSchema: FormUiSchema<any>) {
  const conds = resolveUiSchemaConds({
    uiSchema,
    formData
  });

  return Object.fromEntries(conds.map((cond) => [componentNameSerialize(cond.path), cond]));
}

function getNextFormDataFromConds({
  formData,
  uiSchema
}: {
  formData: Record<string, any>;
  uiSchema: FormUiSchema<any>;
}) {
  const conds = resolveUiSchemaConds({
    uiSchema,
    formData
  });
  return produce(formData, (draft) => {
    conds.forEach(({ cond, path }) => {
      if (!cond) {
        unset(draft, path);
      }
    });
  });
}

type IFormReducerBasePayload<T> = T & {
  schema: FormSchema;
};

type IFormReducerAction =
  | {
      type: 'onChange';
      payload: IFormReducerBasePayload<{
        uiSchema: FormUiSchema<any>;
        event: ChangePayload;
        liveValidate?: boolean;
      }>;
    }
  | {
      type: 'onError';
      payload: {
        errors: ErrorsMap;
      };
    }
  | {
      type: 'submitSuccess';
    }
  | {
      type: 'set';
      payload: IFormReducerBasePayload<{
        value: any;
        liveValidate?: boolean;
        uiSchema: FormUiSchema<any>;
      }>;
    };

interface IFormReducerState {
  formData: Record<string, any>;
  conds: FormConds;
  errors: ErrorsMap;
}

function validate(
  value: any,
  schema: FormSchema,
  uiSchema?: FormUiSchema<any>
):
  | {
      isValid: true;
      data: any;
    }
  | {
      isValid: false;
      errors: ErrorsMap;
    } {
  const parsed = schema.safeParse(
    getNextFormDataFromConds({
      formData: value,
      uiSchema: uiSchema ?? {}
    })
  );

  if (parsed.success) {
    return { isValid: true, data: parsed.data };
  } else {
    return {
      isValid: false,
      errors: groupBy(parsed.error.errors, (item) => componentNameSerialize(item.path))
    };
  }
}

const STABLE_NO_ERRORS = {};

function formNextValue(prev: any, event: ChangePayload): any {
  return produce(prev, (draft: any) => {
    switch (event.op) {
      case 'update':
        set(draft, event.path, event.value);
        break;
      case 'remove':
        unset(draft, event.path, {
          arrayBehavior: 'setToUndefined'
        });
        break;
      case 'array-add':
        set(draft, event.path, event.value);
        break;
      case 'array-remove':
        unset(draft, event.path, {
          arrayBehavior: 'delete'
        });
        break;
    }
  });
}

function formReducer(state: IFormReducerState, action: IFormReducerAction) {
  if (action.type === 'onChange') {
    const { uiSchema, event, liveValidate } = action.payload;

    const nextFormData = formNextValue(state.formData, event);

    const result = liveValidate ? validate(nextFormData, action.payload.schema, uiSchema) : undefined;

    return {
      ...state,
      conds: resolveNextFormConds(nextFormData, uiSchema),
      formData: nextFormData,
      errors: result ? (result.isValid ? STABLE_NO_ERRORS : result.errors) : state.errors
    };
  }

  if (action.type === 'onError') {
    return {
      ...state,
      errors: action.payload.errors
    };
  }

  if (action.type === 'submitSuccess') {
    return {
      ...state,
      errors: STABLE_NO_ERRORS
    };
  }

  if (action.type === 'set') {
    const { uiSchema, value, schema, liveValidate } = action.payload;
    const result = liveValidate ? validate(value, schema, uiSchema) : undefined;

    return {
      ...state,
      conds: resolveNextFormConds(value, uiSchema),
      formData: value,
      errors: result ? (result.isValid ? STABLE_NO_ERRORS : result.errors) : state.errors
    };
  }

  throw new Error(`Unknown action type: ${(action as any).type}`);
}

function flattenErrorsToZodIssues(errors: ErrorsMap): zod.ZodIssue[] {
  return flatten(values(errors));
}

export function UncontrolledForm<Schema extends FormSchema>({
  schema,
  uiSchema,

  onChange,
  onSubmit,
  defaultValues,

  components,
  title,

  children,
  liveValidate = false,
  onErrorsChange,
  className,

  showSubmitButton = false
}: IUncontrolledFormProps<Schema>) {
  const objectSchema = useMemo(() => resolveObjectSchema(schema), [schema]);

  const [state, dispatch] = useReducer(formReducer, undefined, () => {
    const formData = defaultValues ?? formDefaultValueFromSchema(objectSchema);
    const conds = resolveNextFormConds(formData, uiSchema ?? {});
    return {
      formData,
      conds,
      errors: STABLE_NO_ERRORS
    };
  });
  const { formData, conds, errors } = state;

  const handleSubmit = useCallback(
    (value: typeof formData) => {
      const result = validate(value, schema, uiSchema ?? {});

      if (result.isValid) {
        dispatch({
          type: 'submitSuccess'
        });
        onSubmit?.(result.data);
      } else {
        dispatch({
          type: 'onError',
          payload: {
            errors: result.errors
          }
        });
      }
    },
    [onSubmit, schema, uiSchema]
  );

  const handleChange: OnChange = useCallback(
    (event) => {
      dispatch({
        type: 'onChange',
        payload: {
          event,
          uiSchema: uiSchema ?? {},
          schema,
          liveValidate
        }
      });

      onChange?.({
        change: event,
        patch: formNextValue({}, event),
        formData: formNextValue(formData, event)
      });
    },
    [formData, liveValidate, onChange, schema, uiSchema]
  );

  const updateForm = useCallback(
    (updater: (old: any) => void) => {
      const newData = produce(formData, updater);
      dispatch({
        type: 'set',
        payload: {
          value: newData,
          schema,
          uiSchema: uiSchema ?? {},
          liveValidate
        }
      });
    },
    [formData, liveValidate, schema, uiSchema]
  );

  useEffect(() => {
    onErrorsChange?.(flattenErrorsToZodIssues(errors));
  }, [errors, onErrorsChange]);

  return (
    <form
      className={className}
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit(formData);
      }}
    >
      {title}

      <FormContextProvider
        value={{
          conds,
          errors,
          onChange: handleChange,
          components
        }}
      >
        <FormContext.Provider value={{ value: formData, update: updateForm }}>
          <ZodAnyComponent uiSchema={uiSchema} value={formData} schema={objectSchema} />
        </FormContext.Provider>
      </FormContextProvider>

      {children
        ? children({ errors: flattenErrorsToZodIssues(errors) })
        : showSubmitButton && <button type="submit">Submit</button>}
    </form>
  );
}

export function ControlledForm<Schema extends FormSchema>({
  schema,
  value,
  components,
  onChange,
  onErrorsChange,
  uiSchema,
  liveValidate,
  title,
  children,
  onSubmit,
  className
}: IControlledFormProps<Schema>) {
  const [errors, setErrors] = useState<ErrorsMap>(STABLE_NO_ERRORS);
  const [conds, setConds] = useState<FormConds>(resolveNextFormConds(value, uiSchema ?? {}));

  const objectSchema = useMemo(() => resolveObjectSchema(schema), [schema]);

  const handleValidateResult = useCallback(
    (result: ReturnType<typeof validate>) => {
      if (result.isValid) {
        setErrors(STABLE_NO_ERRORS);
        onErrorsChange?.([]);
      } else {
        setErrors(result.errors);
        onErrorsChange?.(flattenErrorsToZodIssues(result.errors));
      }
    },
    [onErrorsChange]
  );

  const handleSubmit = useCallback(() => {
    const result = validate(value, schema, uiSchema ?? {});
    handleValidateResult(result);
    if (result.isValid) {
      onSubmit?.(result.data);
    }
  }, [handleValidateResult, onSubmit, schema, uiSchema, value]);

  const handleChange: OnChange = useCallback(
    (event) => {
      onChange?.((oldValue) => formNextValue(oldValue, event));
    },
    [onChange]
  );

  const handleUpdate = useCallback(
    (updater: (value: any) => void) => {
      onChange?.((oldValue) => {
        const res: any = produce(oldValue, (draft: any) => {
          updater(draft);
        });
        return res;
      });
    },
    [onChange]
  );

  useEffect(() => {
    if (liveValidate) {
      handleValidateResult(validate(value, schema, uiSchema ?? {}));
    }
  }, [handleValidateResult, liveValidate, schema, uiSchema, value]);

  useEffect(() => {
    setConds(resolveNextFormConds(value, uiSchema ?? {}));
  }, [uiSchema, value]);

  return (
    <form
      className={className}
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit();
      }}
    >
      {title}

      <FormContextProvider
        value={{
          conds,
          errors,
          onChange: handleChange,
          components
        }}
      >
        <FormContext.Provider value={{ value, update: handleUpdate }}>
          <ZodAnyComponent uiSchema={uiSchema} value={value} schema={objectSchema} />
        </FormContext.Provider>
      </FormContextProvider>

      {children ? (
        children({ errors: flattenErrorsToZodIssues(errors) })
      ) : (
        <button type="submit">Submit</button>
      )}
    </form>
  );
}

// By default we'll export an uncontrolled form, with a warning if value is passed in
export function Form<Schema extends FormSchema>(props: IUncontrolledFormProps<Schema>) {
  useUncontrolledToControlledWarning((props as any).value);

  return <UncontrolledForm {...props} />;
}
