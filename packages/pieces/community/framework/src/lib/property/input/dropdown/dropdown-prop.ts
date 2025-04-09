import { Type } from '@sinclair/typebox'
import { PropertyContext } from '../../../context'
import { BasePropertySchema, TPropertyValue } from '../common'
import { PropertyType } from '../property-type'
import { DropdownState } from './common'

type DynamicDropdownOptions<T> = (
  propsValue: Record<string, unknown>,
  ctx: PropertyContext,
) => Promise<DropdownState<T>>

export const DropdownProperty = Type.Composite([
  BasePropertySchema,
  TPropertyValue(Type.Unknown(), PropertyType.DROPDOWN),
  Type.Object({
    refreshers: Type.Array(Type.String()),
  }),
])

export type DropdownProperty<T, R extends boolean> = BasePropertySchema & {
  refreshers: string[]
  refreshOnSearch?: boolean
  options: DynamicDropdownOptions<T>
} & TPropertyValue<T, PropertyType.DROPDOWN, R>

export const MultiSelectDropdownProperty = Type.Composite([
  BasePropertySchema,
  TPropertyValue(Type.Array(Type.Unknown()), PropertyType.MULTI_SELECT_DROPDOWN),
  Type.Object({
    refreshers: Type.Array(Type.String()),
  }),
])

export type MultiSelectDropdownProperty<T, R extends boolean> = BasePropertySchema & {
  refreshers: string[]
  options: DynamicDropdownOptions<T>
} & TPropertyValue<T[], PropertyType.MULTI_SELECT_DROPDOWN, R>
