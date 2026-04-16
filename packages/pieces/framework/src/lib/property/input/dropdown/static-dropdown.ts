import { z } from 'zod'
import { BasePropertySchema, TPropertyValue } from '../common'
import { PropertyType } from '../property-type'
import { DropdownState } from './common'

export const StaticDropdownProperty = z.object({
    ...BasePropertySchema.shape,
    options: DropdownState,
    ...TPropertyValue(z.unknown(), PropertyType.STATIC_DROPDOWN).shape,
})

export type StaticDropdownProperty<T, R extends boolean> = BasePropertySchema & {
    options: DropdownState<T>
} & TPropertyValue<T, PropertyType.STATIC_DROPDOWN, R>

export const StaticMultiSelectDropdownProperty = z.object({
    ...BasePropertySchema.shape,
    options: DropdownState,
    ...TPropertyValue(z.array(z.unknown()), PropertyType.STATIC_MULTI_SELECT_DROPDOWN).shape,
})

export type StaticMultiSelectDropdownProperty<T, R extends boolean> = BasePropertySchema & {
    options: DropdownState<T>
} & TPropertyValue<T[], PropertyType.STATIC_MULTI_SELECT_DROPDOWN, R>
