import * as z from "zod/mini";
import { BasePropertySchema, TPropertyValue } from "./common";
import { PropertyType } from "./property-type";

export const NumberProperty = z.object({
    ...BasePropertySchema.shape,
    display: z.optional(z.enum(['stepper'])),
    min: z.optional(z.number()),
    max: z.optional(z.number()),
    step: z.optional(z.number()),
    ...TPropertyValue(z.number(), PropertyType.NUMBER).shape,
})

export type NumberProperty<R extends boolean> = BasePropertySchema & {
  /** 'stepper' renders a −/value/+ control bounded by min/max. */
  display?: 'stepper';
  min?: number;
  max?: number;
  step?: number;
} & TPropertyValue<number, PropertyType.NUMBER, R>;
