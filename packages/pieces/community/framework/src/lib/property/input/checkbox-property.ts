import { Type } from "@sinclair/typebox";
import { BasePropertySchema, TPropertyValue } from "./common";
import { PropertyType } from "./property-type";
import { ValidationInputType } from "../../validators/types";

export const CheckboxProperty = Type.Composite([
  BasePropertySchema,
  TPropertyValue(Type.Boolean(), PropertyType.CHECKBOX)
])

export type CheckboxProperty<R extends boolean> = BasePropertySchema &
  TPropertyValue<boolean, PropertyType.CHECKBOX, ValidationInputType.ANY, R>;
