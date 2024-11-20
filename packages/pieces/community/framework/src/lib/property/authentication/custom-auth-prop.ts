import { Type } from '@sinclair/typebox';
import { TPropertyValue } from '../input/common';
import { PropertyType } from '../input/property-type';
import { LongTextProperty, ShortTextProperty } from '../input/text-property';
import { NumberProperty } from '../input/number-property';
import { CheckboxProperty } from '../input/checkbox-property';
import { StaticDropdownProperty } from '../input/dropdown/static-dropdown';
import { StaticPropsValue } from '..';
import { SecretTextProperty } from './secret-text-property';
import { BasePieceAuthSchema } from './common';

const CustomAuthProps = Type.Record(Type.String(), Type.Union([
  ShortTextProperty,
  LongTextProperty,
  NumberProperty,
  CheckboxProperty,
  StaticDropdownProperty,
]));

export type CustomAuthProps = Record<
  string,
  | ShortTextProperty<boolean>
  | LongTextProperty<boolean>
  | SecretTextProperty<boolean>
  | NumberProperty<boolean>
  | StaticDropdownProperty<unknown, boolean>
  | CheckboxProperty<boolean>
>;

export const CustomAuthProperty = Type.Composite([
  BasePieceAuthSchema,
  Type.Object({
    props: CustomAuthProps,
  }),
  TPropertyValue(Type.Unknown(), PropertyType.CUSTOM_AUTH)
])

export type CustomAuthProperty<
  T extends CustomAuthProps
> = BasePieceAuthSchema<StaticPropsValue<T>> & {
  props: T;
} &
  TPropertyValue<
    StaticPropsValue<T>,
    PropertyType.CUSTOM_AUTH,
    true
  >;

