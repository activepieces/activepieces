import { z } from "zod";
import { BasePropertySchema, TPropertyValue } from "./common";
import { PropertyType } from "./property-type";

export const ColorProperty = z.object({
    ...BasePropertySchema.shape,
    ...TPropertyValue(z.string(), PropertyType.COLOR).shape,
})


export type ColorProperty<R extends boolean> = BasePropertySchema &
    TPropertyValue<string, PropertyType.COLOR, R>;
