import { Type } from "@sinclair/typebox";
import { BasePropertySchema, TPropertyValue } from "./common";
import { PropertyType } from "./property-type";
import { ValidationInputType } from "../../validators/types";

export const ArrayProperty = Type.Composite([
    BasePropertySchema,
    TPropertyValue(Type.Array(Type.Unknown()), PropertyType.ARRAY)
])

export type ArrayProperty<R extends boolean> = BasePropertySchema &
    TPropertyValue<unknown[], PropertyType.ARRAY, ValidationInputType.ARRAY, R>;