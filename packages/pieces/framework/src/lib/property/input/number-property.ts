import { BasePropertySchema, TPropertyValue } from "./common";
import { PropertyType } from "./property-type";

export type NumberProperty<R extends boolean> = BasePropertySchema & {
  display?: 'stepper';
  min?: number;
  max?: number;
  step?: number;
} & TPropertyValue<number, PropertyType.NUMBER, R>;
