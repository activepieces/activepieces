import { z } from "zod";
import { BasePropertySchema, TPropertyValue } from "./common";
import { PropertyType } from "./property-type";

export const CheckboxProperty = z.object({
  ...BasePropertySchema.shape,
  ...TPropertyValue(z.boolean(), PropertyType.CHECKBOX).shape,
})

export type CheckboxProperty<R extends boolean> = BasePropertySchema &
  TPropertyValue<boolean, PropertyType.CHECKBOX, R>;
