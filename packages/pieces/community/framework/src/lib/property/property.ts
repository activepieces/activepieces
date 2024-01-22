import {
  ArrayProperty,
  CheckboxProperty,
  DateTimeProperty,
  FileProperty,
  JsonProperty,
  LongTextProperty,
  MarkDownProperty,
  MarkDownPropertySchema,
  NumberProperty,
  ObjectProperty,
  SecretTextProperty,
  ShortTextProperty,
} from './base-prop';
import { BasicAuthProperty } from './basic-auth-prop';
import { CustomAuthProperty, CustomAuthProps } from './custom-auth-prop';
import {
  DropdownProperty,
  MultiSelectDropdownProperty,
  StaticDropdownProperty,
  StaticMultiSelectDropdownProperty,
} from './dropdown-prop';
import { DynamicProperties } from './dynamic-prop';
import { OAuth2Property, OAuth2Props } from './oauth2-prop';
import { Processors } from '../processors/processors';
import { Validators } from '../validators/validators';

export enum PropertyType {
  SHORT_TEXT = 'SHORT_TEXT',
  LONG_TEXT = 'LONG_TEXT',
  MARKDOWN = 'MARKDOWN',
  DROPDOWN = 'DROPDOWN',
  STATIC_DROPDOWN = 'STATIC_DROPDOWN',
  NUMBER = 'NUMBER',
  CHECKBOX = 'CHECKBOX',
  OAUTH2 = 'OAUTH2',
  SECRET_TEXT = 'SECRET_TEXT',
  ARRAY = 'ARRAY',
  OBJECT = 'OBJECT',
  BASIC_AUTH = 'BASIC_AUTH',
  JSON = 'JSON',
  MULTI_SELECT_DROPDOWN = 'MULTI_SELECT_DROPDOWN',
  STATIC_MULTI_SELECT_DROPDOWN = 'STATIC_MULTI_SELECT_DROPDOWN',
  DYNAMIC = 'DYNAMIC',
  CUSTOM_AUTH = 'CUSTOM_AUTH',
  DATE_TIME = 'DATE_TIME',
  FILE = 'FILE',
}

export type PieceAuthProperty =
  | BasicAuthProperty<boolean>
  | CustomAuthProperty<boolean, any>
  | OAuth2Property<boolean, OAuth2Props>
  | SecretTextProperty<boolean>;

export type NonAuthPieceProperty =
  | ShortTextProperty<boolean>
  | LongTextProperty<boolean>
  | MarkDownProperty
  | OAuth2Property<boolean, OAuth2Props>
  | CheckboxProperty<boolean>
  | DropdownProperty<any, boolean>
  | StaticDropdownProperty<any, boolean>
  | NumberProperty<boolean>
  | ArrayProperty<boolean>
  | ObjectProperty<boolean>
  | JsonProperty<boolean>
  | MultiSelectDropdownProperty<unknown, boolean>
  | StaticMultiSelectDropdownProperty<unknown, boolean>
  | DynamicProperties<boolean>
  | DateTimeProperty<boolean>
  | FileProperty<boolean>;

export type PieceProperty = NonAuthPieceProperty | PieceAuthProperty;

export interface PiecePropertyMap {
  [name: string]: PieceProperty;
}

export interface NonAuthPiecePropertyMap {
  [name: string]: NonAuthPieceProperty;
}

export type PiecePropValueSchema<T extends PieceProperty | PieceAuthProperty> =
  T extends undefined
  ? undefined
  : T extends { required: true }
  ? T['valueSchema']
  : T['valueSchema'] | undefined;

export type StaticPropsValue<T extends PiecePropertyMap> = {
  [P in keyof T]: PiecePropValueSchema<T[P]>;
};

export const Property = {
  ShortText<R extends boolean>(
    request: Properties<ShortTextProperty<R>>
  ): R extends true ? ShortTextProperty<true> : ShortTextProperty<false> {
    return {
      ...request,
      valueSchema: undefined,
      type: PropertyType.SHORT_TEXT,
      defaultValidators: [Validators.string],
    } as unknown as R extends true
      ? ShortTextProperty<true>
      : ShortTextProperty<false>;
  },
  Checkbox<R extends boolean>(
    request: Properties<CheckboxProperty<R>>
  ): R extends true ? CheckboxProperty<true> : CheckboxProperty<false> {
    return {
      ...request,
      valueSchema: undefined,
      type: PropertyType.CHECKBOX,
    } as unknown as R extends true
      ? CheckboxProperty<true>
      : CheckboxProperty<false>;
  },
  LongText<R extends boolean>(
    request: Properties<LongTextProperty<R>>
  ): R extends true ? LongTextProperty<true> : LongTextProperty<false> {
    return {
      ...request,
      valueSchema: undefined,
      type: PropertyType.LONG_TEXT,
    } as unknown as R extends true
      ? LongTextProperty<true>
      : LongTextProperty<false>;
  },
  MarkDown(request: MarkDownPropertySchema): MarkDownProperty {
    return {
      displayName: 'Markdown',
      required: true,
      description: request.value,
      type: PropertyType.MARKDOWN,
      valueSchema: undefined as never,
    };
  },
  Number<R extends boolean>(
    request: Properties<NumberProperty<R>>
  ): R extends true ? NumberProperty<true> : NumberProperty<false> {
    return {
      ...request,
      defaultProcessors: [Processors.number],
      defaultValidators: [Validators.number],
      valueSchema: undefined,
      type: PropertyType.NUMBER,
    } as unknown as R extends true
      ? NumberProperty<true>
      : NumberProperty<false>;
  },

  Json<R extends boolean>(
    request: Properties<JsonProperty<R>>
  ): R extends true ? JsonProperty<true> : JsonProperty<false> {
    return {
      ...request,
      valueSchema: undefined,
      type: PropertyType.JSON,
      defaultProcessors: [Processors.json],
    } as unknown as R extends true ? JsonProperty<true> : JsonProperty<false>;
  },
  Array<R extends boolean>(
    request: Properties<ArrayProperty<R>>
  ): R extends true ? ArrayProperty<true> : ArrayProperty<false> {
    return {
      ...request,
      valueSchema: undefined,
      type: PropertyType.ARRAY,
    } as unknown as R extends true ? ArrayProperty<true> : ArrayProperty<false>;
  },
  Object<R extends boolean>(
    request: Properties<ObjectProperty<R>>
  ): R extends true ? ObjectProperty<true> : ObjectProperty<false> {
    return {
      ...request,
      valueSchema: undefined,
      type: PropertyType.OBJECT,
    } as unknown as R extends true
      ? ObjectProperty<true>
      : ObjectProperty<false>;
  },
  Dropdown<T, R extends boolean = boolean>(
    request: Properties<DropdownProperty<T, R>>
  ): R extends true ? DropdownProperty<T, true> : DropdownProperty<T, false> {
    return {
      ...request,
      valueSchema: undefined,
      type: PropertyType.DROPDOWN,
    } as unknown as R extends true
      ? DropdownProperty<T, true>
      : DropdownProperty<T, false>;
  },
  StaticDropdown<T, R extends boolean = boolean>(
    request: Properties<StaticDropdownProperty<T, R>>
  ): R extends true
    ? StaticDropdownProperty<T, true>
    : StaticDropdownProperty<T, false> {
    return {
      ...request,
      valueSchema: undefined,
      type: PropertyType.STATIC_DROPDOWN,
    } as unknown as R extends true
      ? StaticDropdownProperty<T, true>
      : StaticDropdownProperty<T, false>;
  },
  MultiSelectDropdown<T, R extends boolean = boolean>(
    request: Properties<MultiSelectDropdownProperty<T, R>>
  ): R extends true
    ? MultiSelectDropdownProperty<T, true>
    : MultiSelectDropdownProperty<T, false> {
    return {
      ...request,
      valueSchema: undefined,
      type: PropertyType.MULTI_SELECT_DROPDOWN,
    } as unknown as R extends true
      ? MultiSelectDropdownProperty<T, true>
      : MultiSelectDropdownProperty<T, false>;
  },
  DynamicProperties<R extends boolean = boolean>(
    request: Properties<DynamicProperties<R>>
  ): R extends true ? DynamicProperties<true> : DynamicProperties<false> {
    return {
      ...request,
      valueSchema: undefined,
      type: PropertyType.DYNAMIC,
    } as unknown as R extends true
      ? DynamicProperties<true>
      : DynamicProperties<false>;
  },
  StaticMultiSelectDropdown<T, R extends boolean = boolean>(
    request: Properties<StaticMultiSelectDropdownProperty<T, R>>
  ): R extends true
    ? StaticMultiSelectDropdownProperty<T, true>
    : StaticMultiSelectDropdownProperty<T, false> {
    return {
      ...request,
      valueSchema: undefined,
      type: PropertyType.STATIC_MULTI_SELECT_DROPDOWN,
    } as unknown as R extends true
      ? StaticMultiSelectDropdownProperty<T, true>
      : StaticMultiSelectDropdownProperty<T, false>;
  },
  DateTime<R extends boolean>(
    request: Properties<DateTimeProperty<R>>
  ): R extends true ? DateTimeProperty<true> : DateTimeProperty<false> {
    return {
      ...request,
      defaultProcessors: [Processors.datetime],
      defaultValidators: [Validators.datetimeIso],
      valueSchema: undefined,
      type: PropertyType.DATE_TIME,
    } as unknown as R extends true
      ? DateTimeProperty<true>
      : DateTimeProperty<false>;
  },
  File<R extends boolean>(
    request: Properties<FileProperty<R>>
  ): R extends true ? FileProperty<true> : FileProperty<false> {
    return {
      ...request,
      defaultProcessors: [Processors.file],
      defaultValidators: [Validators.file],
      valueSchema: undefined,
      type: PropertyType.FILE,
    } as unknown as R extends true ? FileProperty<true> : FileProperty<false>;
  },
};

export const PieceAuth = {
  SecretText<R extends boolean>(
    request: Properties<SecretTextProperty<R>>
  ): R extends true ? SecretTextProperty<true> : SecretTextProperty<false> {
    return {
      ...request,
      valueSchema: undefined,
      type: PropertyType.SECRET_TEXT,
    } as unknown as R extends true
      ? SecretTextProperty<true>
      : SecretTextProperty<false>;
  },
  BasicAuth<R extends boolean>(
    request: AuthProperties<BasicAuthProperty<R>>
  ): R extends true ? BasicAuthProperty<true> : BasicAuthProperty<false> {
    return {
      ...request,
      valueSchema: undefined,
      type: PropertyType.BASIC_AUTH,
      displayName: 'Connection',
    } as unknown as R extends true
      ? BasicAuthProperty<true>
      : BasicAuthProperty<false>;
  },
  CustomAuth<R extends boolean, T extends CustomAuthProps>(
    request: AuthProperties<CustomAuthProperty<R, T>>
  ): R extends true
    ? CustomAuthProperty<true, T>
    : CustomAuthProperty<false, T> {
    return {
      ...request,
      valueSchema: undefined,
      type: PropertyType.CUSTOM_AUTH,
      displayName: 'Connection',
    } as unknown as R extends true
      ? CustomAuthProperty<true, T>
      : CustomAuthProperty<false, T>;
  },
  OAuth2<R extends boolean, T extends OAuth2Props>(
    request: AuthProperties<OAuth2Property<R, T>>
  ): R extends true ? OAuth2Property<true, T> : OAuth2Property<false, T> {
    return {
      ...request,
      valueSchema: undefined,
      type: PropertyType.OAUTH2,
      displayName: 'Connection',
    } as unknown as R extends true
      ? OAuth2Property<true, T>
      : OAuth2Property<false, T>;
  },
  None() {
    return undefined;
  },
};

type AuthProperties<T> = Omit<Properties<T>, 'displayName'>;

type Properties<T> = Omit<
  T,
  'valueSchema' | 'type' | 'defaultValidators' | 'defaultProcessors'
>;
