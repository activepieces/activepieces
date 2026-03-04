import { Type } from "@sinclair/typebox";
import { BasePropertySchema, TPropertyValue } from "./common";
import { PropertyType } from "./property-type";

export const NumberProperty = Type.Composite([
    BasePropertySchema,
    TPropertyValue(Type.Number(), PropertyType.NUMBER)
])

export type NumberProperty<R extends boolean> = BasePropertySchema &
  TPropertyValue<number, PropertyType.NUMBER, R>;