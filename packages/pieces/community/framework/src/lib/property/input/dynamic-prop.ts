import { Type } from '@sinclair/typebox'
import { DropdownState, InputPropertyMap } from '..'
import { PropertyContext } from '../../context'
import { ArrayProperty } from './array-property'
import { BasePropertySchema, TPropertyValue } from './common'
import { StaticDropdownProperty, StaticMultiSelectDropdownProperty } from './dropdown/static-dropdown'
import { JsonProperty } from './json-property'
import { PropertyType } from './property-type'
import { ShortTextProperty } from './text-property'

export const DynamicProp = Type.Union([
  ShortTextProperty,
  StaticDropdownProperty,
  JsonProperty,
  ArrayProperty,
  StaticMultiSelectDropdownProperty,
])

export type DynamicProp =
  | ShortTextProperty<boolean>
  | StaticDropdownProperty<any, boolean>
  | JsonProperty<boolean>
  | ArrayProperty<boolean>
  | StaticMultiSelectDropdownProperty<any, boolean>

export const DynamicPropsValue = Type.Record(Type.String(), DynamicProp)

export type DynamicPropsValue = Record<string, DynamicProp['valueSchema']>

export const DynamicProperties = Type.Composite([
  Type.Object({
    refreshers: Type.Array(Type.String()),
  }),
  BasePropertySchema,
  TPropertyValue(Type.Unknown(), PropertyType.DYNAMIC),
])

export type DynamicProperties<R extends boolean> = BasePropertySchema & {
  props: (propsValue: Record<string, DynamicPropsValue>, ctx: PropertyContext) => Promise<InputPropertyMap>
  refreshers: string[]
} & TPropertyValue<DynamicPropsValue, PropertyType.DYNAMIC, R>
