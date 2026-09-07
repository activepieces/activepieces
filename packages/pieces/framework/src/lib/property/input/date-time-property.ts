import { BasePropertySchema, TPropertyValue } from "./common";
import { PropertyType } from "./property-type";

export type DateTimeProperty<R extends boolean> = BasePropertySchema &
  TPropertyValue<string, PropertyType.DATE_TIME, R>;
