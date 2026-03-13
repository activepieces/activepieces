import { z } from 'zod';
import { TPropertyValue } from '../input/common';
import { PropertyType } from '../input/property-type';
import { LongTextProperty, ShortTextProperty } from '../input/text-property';
import { NumberProperty } from '../input/number-property';
import { CheckboxProperty } from '../input/checkbox-property';
import { StaticDropdownProperty, StaticMultiSelectDropdownProperty } from '../input/dropdown/static-dropdown';
import { StaticPropsValue } from '..';
import { SecretTextProperty } from './secret-text-property';
import { BasePieceAuthSchema } from './common';
import { MarkDownProperty } from '../input/markdown-property';

const CustomAuthProps = z.record(z.string(), z.union([
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
  | MarkDownProperty
  | StaticMultiSelectDropdownProperty<unknown, boolean>
>;

export const CustomAuthProperty = z.object({
  ...BasePieceAuthSchema.shape,
  props: CustomAuthProps,
  ...TPropertyValue(z.unknown(), PropertyType.CUSTOM_AUTH).shape,
})

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
