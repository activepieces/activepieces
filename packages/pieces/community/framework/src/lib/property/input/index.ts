import { Type } from '@sinclair/typebox';
import { ArrayProperty } from './array-property';
import { CheckboxProperty } from './checkbox-property';
import { DateTimeProperty } from './date-time-property';
import {
  DropdownProperty,
  MultiSelectDropdownProperty,
} from './dropdown/dropdown-prop';
import {
  StaticDropdownProperty,
  StaticMultiSelectDropdownProperty,
} from './dropdown/static-dropdown';
import { DynamicProperties } from './dynamic-prop';
import { FileProperty } from './file-property';
import { JsonProperty } from './json-property';
import { MarkDownProperty } from './markdown-property';
import { MarkdownVariant } from '@activepieces/shared';
import { NumberProperty } from './number-property';
import { ObjectProperty } from './object-property';
import { PropertyType } from './property-type';
import { LongTextProperty, ShortTextProperty } from './text-property';

export const InputProperty = Type.Union([
  ShortTextProperty,
  LongTextProperty,
  MarkDownProperty,
  CheckboxProperty,
  StaticDropdownProperty,
  StaticMultiSelectDropdownProperty,
  DropdownProperty,
  MultiSelectDropdownProperty,
  DynamicProperties,
  NumberProperty,
  ArrayProperty,
  ObjectProperty,
  JsonProperty,
  DateTimeProperty,
  FileProperty,
]);

export type InputProperty =
  | ShortTextProperty<boolean>
  | LongTextProperty<boolean>
  | MarkDownProperty
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

type Properties<T> = Omit<
  T,
  'valueSchema' | 'type' | 'defaultValidators' | 'defaultProcessors'
>;

export const Property = {
  ShortText<R extends boolean>(
    request: Properties<ShortTextProperty<R>>
  ): R extends true ? ShortTextProperty<true> : ShortTextProperty<false> {
    return {
      ...request,
      valueSchema: undefined,
      type: PropertyType.SHORT_TEXT,
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
  MarkDown(request: {
    value: string;
    variant?: MarkdownVariant;
  }): MarkDownProperty {
    return {
      displayName: 'Markdown',
      required: false,
      description: request.value,
      type: PropertyType.MARKDOWN,
      valueSchema: undefined as never,
      variant: request.variant ?? MarkdownVariant.INFO,
    };
  },
  Number<R extends boolean>(
    request: Properties<NumberProperty<R>>
  ): R extends true ? NumberProperty<true> : NumberProperty<false> {
    return {
      ...request,
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
      valueSchema: undefined,
      type: PropertyType.FILE,
    } as unknown as R extends true ? FileProperty<true> : FileProperty<false>;
  },
};
