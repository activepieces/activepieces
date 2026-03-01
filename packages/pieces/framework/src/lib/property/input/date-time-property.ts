import { Type } from "@sinclair/typebox";
import { BasePropertySchema, TPropertyValue } from "./common";
import { PropertyType } from "./property-type";

export const DateTimeProperty = Type.Composite([
  BasePropertySchema,
  TPropertyValue(Type.String(), PropertyType.DATE_TIME)
])

export type DateTimeProperty<R extends boolean> = BasePropertySchema &
  TPropertyValue<string, PropertyType.DATE_TIME, R>; 