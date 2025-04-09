import { Type } from '@sinclair/typebox'
import { StaticPropsValue } from '..'
import { CheckboxProperty } from '../input/checkbox-property'
import { TPropertyValue } from '../input/common'
import { StaticDropdownProperty } from '../input/dropdown/static-dropdown'
import { NumberProperty } from '../input/number-property'
import { PropertyType } from '../input/property-type'
import { LongTextProperty, ShortTextProperty } from '../input/text-property'
import { BasePieceAuthSchema } from './common'
import { SecretTextProperty } from './secret-text-property'

const CustomAuthProps = Type.Record(
  Type.String(),
  Type.Union([ShortTextProperty, LongTextProperty, NumberProperty, CheckboxProperty, StaticDropdownProperty]),
)

export type CustomAuthProps = Record<
  string,
  | ShortTextProperty<boolean>
  | LongTextProperty<boolean>
  | SecretTextProperty<boolean>
  | NumberProperty<boolean>
  | StaticDropdownProperty<unknown, boolean>
  | CheckboxProperty<boolean>
>

export const CustomAuthProperty = Type.Composite([
  BasePieceAuthSchema,
  Type.Object({
    props: CustomAuthProps,
  }),
  TPropertyValue(Type.Unknown(), PropertyType.CUSTOM_AUTH),
])

export type CustomAuthProperty<T extends CustomAuthProps> = BasePieceAuthSchema<StaticPropsValue<T>> & {
  props: T
} & TPropertyValue<StaticPropsValue<T>, PropertyType.CUSTOM_AUTH, true>
