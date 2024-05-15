import { Type } from "@sinclair/typebox";
import { BasePropertySchema, TPropertyValue } from "./common";
import { PropertyType } from "./property-type";
import { ValidationInputType } from "../../validators/types";


export const ShortTextProperty = Type.Composite([
    BasePropertySchema,
    TPropertyValue(Type.String(), PropertyType.SHORT_TEXT)
])


export type ShortTextProperty<R extends boolean> = BasePropertySchema &
    TPropertyValue<string, PropertyType.SHORT_TEXT, ValidationInputType.STRING, R>;


export const LongTextProperty = Type.Composite([
    BasePropertySchema,
    TPropertyValue(Type.String(), PropertyType.LONG_TEXT)
])

export type LongTextProperty<R extends boolean> = BasePropertySchema &
    TPropertyValue<string, PropertyType.LONG_TEXT, ValidationInputType.STRING, R>;
