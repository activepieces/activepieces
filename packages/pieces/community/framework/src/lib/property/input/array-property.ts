import { Type } from '@sinclair/typebox'
import { CheckboxProperty } from './checkbox-property'
import { ColorProperty } from './color-property'
import { BasePropertySchema, TPropertyValue } from './common'
import { MultiSelectDropdownProperty } from './dropdown/dropdown-prop'
import { StaticDropdownProperty, StaticMultiSelectDropdownProperty } from './dropdown/static-dropdown'
import { FileProperty } from './file-property'
import { JsonProperty } from './json-property'
import { NumberProperty } from './number-property'
import { PropertyType } from './property-type'
import { LongTextProperty, ShortTextProperty } from './text-property'

export const ArraySubProps = Type.Record(
  Type.String(),
  Type.Union([
    ShortTextProperty,
    LongTextProperty,
    StaticDropdownProperty,
    MultiSelectDropdownProperty,
    StaticMultiSelectDropdownProperty,
    CheckboxProperty,
    NumberProperty,
    FileProperty,
  ]),
)

export const ArrayProperty = Type.Composite([
  BasePropertySchema,
  Type.Object({
    properties: ArraySubProps,
  }),
  TPropertyValue(Type.Array(Type.Unknown()), PropertyType.ARRAY),
])

export type ArraySubProps<R extends boolean> = Record<
  string,
  | ShortTextProperty<R>
  | LongTextProperty<R>
  | StaticDropdownProperty<any, R>
  | MultiSelectDropdownProperty<any, R>
  | StaticMultiSelectDropdownProperty<any, R>
  | CheckboxProperty<R>
  | NumberProperty<R>
  | FileProperty<R>
  | JsonProperty<R>
  | ColorProperty<R>
>

export type ArrayProperty<R extends boolean> = BasePropertySchema & {
  properties?: ArraySubProps<R>
} & TPropertyValue<unknown[], PropertyType.ARRAY, R>
