import { PropertyType } from './property';
import {
  BasePieceAuthSchema,
  CheckboxProperty,
  LongTextProperty,
  NumberProperty,
  SecretTextProperty,
  ShortTextProperty,
  TPropertyValue,
} from './base-prop';
import { StaticDropdownProperty } from './dropdown-prop';
import { StaticPropsValue } from './property';
import { ValidationInputType } from '../validators/types';

export type CustomAuthProps = Record<
  string,
  | ShortTextProperty<boolean>
  | LongTextProperty<boolean>
  | SecretTextProperty<boolean>
  | NumberProperty<boolean>
  | StaticDropdownProperty<unknown, boolean>
  | CheckboxProperty<boolean>
>;

export type CustomAuthPropertyValue<T extends CustomAuthProps> =
  StaticPropsValue<T>;

export type CustomAuthPropertySchema<T extends CustomAuthProps> =
  BasePieceAuthSchema<CustomAuthPropertyValue<T>> & {
    props: T;
  };

export type CustomAuthProperty<
  R extends boolean,
  T extends CustomAuthProps
> = CustomAuthPropertySchema<T> &
  TPropertyValue<
    CustomAuthPropertyValue<T>,
    PropertyType.CUSTOM_AUTH,
    ValidationInputType.ANY,
    R
  >;
