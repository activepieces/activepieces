import { Type } from '@sinclair/typebox'
import { BasePropertySchema, TPropertyValue } from '../common'
import { PropertyType } from '../property-type'
import { DropdownState } from './common'

export const StaticDropdownProperty = Type.Composite([
  BasePropertySchema,
  Type.Object({
    options: DropdownState,
  }),
  TPropertyValue(Type.Unknown(), PropertyType.STATIC_DROPDOWN),
])

export type StaticDropdownProperty<T, R extends boolean> = BasePropertySchema & {
  options: DropdownState<T>
} & TPropertyValue<T, PropertyType.STATIC_DROPDOWN, R>

export const StaticMultiSelectDropdownProperty = Type.Composite([
  BasePropertySchema,
  Type.Object({
    options: DropdownState,
  }),
  TPropertyValue(Type.Array(Type.Unknown()), PropertyType.STATIC_MULTI_SELECT_DROPDOWN),
])

export type StaticMultiSelectDropdownProperty<T, R extends boolean> = BasePropertySchema & {
  options: DropdownState<T>
} & TPropertyValue<T[], PropertyType.STATIC_MULTI_SELECT_DROPDOWN, R>
