import { PropertyType } from './property';
import { BasePropertySchema, TPropertyValue } from './base-prop';
import { ValidationInputType } from '../validators/types';
import { PropertyContext } from '../context';

export type DropdownState<T> = {
  disabled?: boolean;
  placeholder?: string;
  options: DropdownOption<T>[];
};

export type DropdownOption<T> = {
  label: string;
  value: T;
};

export type DynamicDropdownOptions<T> = (
  propsValue: Record<string, unknown>,
  ctx: PropertyContext
) => Promise<DropdownState<T>>;

export type DropdownProperty<T, R extends boolean> = BasePropertySchema & {
  refreshers: string[];
  options: DynamicDropdownOptions<T>;
} & TPropertyValue<T, PropertyType.DROPDOWN, ValidationInputType.ANY, R>;

export type StaticDropdownProperty<
  T,
  R extends boolean
> = BasePropertySchema & {
  options: DropdownState<T>;
} & TPropertyValue<T, PropertyType.STATIC_DROPDOWN, ValidationInputType.ANY, R>;

export type MultiSelectDropdownProperty<
  T,
  R extends boolean
> = BasePropertySchema & {
  refreshers: string[];
  options: DynamicDropdownOptions<T>;
} & TPropertyValue<
    T[],
    PropertyType.MULTI_SELECT_DROPDOWN,
    ValidationInputType.ANY,
    R
  >;

export type StaticMultiSelectDropdownProperty<
  T,
  R extends boolean
> = BasePropertySchema & {
  options: DropdownState<T>;
} & TPropertyValue<
    T[],
    PropertyType.STATIC_MULTI_SELECT_DROPDOWN,
    ValidationInputType.ANY,
    R
  >;
