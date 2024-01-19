import { PropertyType } from './property';
import {
  BasePropertySchema,
  ShortTextProperty,
  TPropertyValue,
} from './base-prop';
import {
  StaticDropdownProperty,
  StaticMultiSelectDropdownProperty,
} from './dropdown-prop';
import { ValidationInputType } from '../validators/types';
import { PropertyContext } from '../context';

type DynamicProp =
  | ShortTextProperty<boolean>
  | StaticDropdownProperty<any, boolean>
  | StaticMultiSelectDropdownProperty<any, boolean>;

export type DynamicPropsValue = Record<string, DynamicProp['valueSchema']>;

export type DynamicPropsSchema = BasePropertySchema & {
  props: (
    propsValue: Record<string, DynamicPropsValue>,
    ctx: PropertyContext
  ) => Promise<Record<string, DynamicProp>>;
  refreshers: string[];
};

export type DynamicProperties<R extends boolean> = DynamicPropsSchema &
  TPropertyValue<
    DynamicPropsValue,
    PropertyType.DYNAMIC,
    ValidationInputType.ANY,
    R
  >;
