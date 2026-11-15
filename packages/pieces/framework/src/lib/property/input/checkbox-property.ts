import * as z from "zod/mini";
import { BasePropertySchema, TPropertyValue } from "./common";
import { PropertyType } from "./property-type";

export const CheckboxProperty = z.object({
  ...BasePropertySchema.shape,
  reveals: z.optional(z.array(z.string())),
  ...TPropertyValue(z.boolean(), PropertyType.CHECKBOX).shape,
})

export type CheckboxProperty<R extends boolean> = BasePropertySchema & {
  /** Names of sibling props revealed (rendered nested) when this checkbox is on. Effective inside a 'section' group. */
  reveals?: string[];
} & TPropertyValue<boolean, PropertyType.CHECKBOX, R>;
