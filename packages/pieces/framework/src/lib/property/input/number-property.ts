import { z } from "zod";
import { BasePropertySchema, TPropertyValue } from "./common";
import { PropertyType } from "./property-type";

export const NumberProperty = z.object({
    ...BasePropertySchema.shape,
    ...TPropertyValue(z.number(), PropertyType.NUMBER).shape,
})

export type NumberProperty<R extends boolean> = BasePropertySchema &
  TPropertyValue<number, PropertyType.NUMBER, R>;
