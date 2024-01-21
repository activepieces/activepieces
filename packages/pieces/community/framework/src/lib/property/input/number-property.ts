import { Type } from "@sinclair/typebox";
import { BasePropertySchema, TPropertyValue } from "./common";
import { PropertyType } from "./property-type";
import { ValidationInputType } from "../../validators/types";

export const NumberProperty = Type.Composite([
    BasePropertySchema,
    TPropertyValue(Type.Number(), PropertyType.NUMBER)
])

export type NumberProperty<R extends boolean> = BasePropertySchema &
  TPropertyValue<number, PropertyType.NUMBER, ValidationInputType.NUMBER, R>;