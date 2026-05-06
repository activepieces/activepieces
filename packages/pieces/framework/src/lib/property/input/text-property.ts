import { z } from "zod";
import { BasePropertySchema, TPropertyValue } from "./common";
import { PropertyType } from "./property-type";


export const ShortTextProperty = z.object({
    ...BasePropertySchema.shape,
    ...TPropertyValue(z.string(), PropertyType.SHORT_TEXT).shape,
})


export type ShortTextProperty<R extends boolean> = BasePropertySchema &
    TPropertyValue<string, PropertyType.SHORT_TEXT, R>;


export const LongTextProperty = z.object({
    ...BasePropertySchema.shape,
    ...TPropertyValue(z.string(), PropertyType.LONG_TEXT).shape,
})

export type LongTextProperty<R extends boolean> = BasePropertySchema &
    TPropertyValue<string, PropertyType.LONG_TEXT, R>;
