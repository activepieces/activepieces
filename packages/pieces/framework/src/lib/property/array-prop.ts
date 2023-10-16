import { ValidationInputType } from '../validators/types';
import {
  BasePropertySchema,
  CheckboxProperty,
  LongTextProperty,
  NumberProperty,
  ShortTextProperty,
  TPropertyValue,
} from './base-prop';
import {
  DropdownProperty,
  MultiSelectDropdownProperty,
  StaticDropdownProperty,
  StaticMultiSelectDropdownProperty,
} from './dropdown-prop';
import { DynamicProperties } from './dynamic-prop';
import { PropertyType } from './property';

export type ArrayProperty<R extends boolean> = BasePropertySchema &
  TPropertyValue<
    unknown[],
    PropertyType.ARRAY,
    ValidationInputType.ARRAY,
    R
  > & {
    properties?: Record<
      string,
      | ShortTextProperty<R>
      | LongTextProperty<R>
      | StaticDropdownProperty<any, R>
      | DropdownProperty<any, R>
      | MultiSelectDropdownProperty<any, R>
      | StaticMultiSelectDropdownProperty<any, R>
      | DynamicProperties<R>
      | CheckboxProperty<R>
      | NumberProperty<R>
    >;
  };
