import { Type } from "@sinclair/typebox";
import { BasePropertySchema, TPropertyValue } from "./common";
import { PropertyType } from "./property-type";

export const ColorProperty = Type.Composite([
    BasePropertySchema,
    TPropertyValue(Type.String(), PropertyType.COLOR)
])


export type ColorProperty<R extends boolean> = BasePropertySchema &
    TPropertyValue<string, PropertyType.COLOR, R>;