import { z } from "zod";
import { BasePropertySchema, TPropertyValue } from "./common";
import { PropertyType } from "./property-type";

export const DateTimeProperty = z.object({
  ...BasePropertySchema.shape,
  ...TPropertyValue(z.string(), PropertyType.DATE_TIME).shape,
})

export type DateTimeProperty<R extends boolean> = BasePropertySchema &
  TPropertyValue<string, PropertyType.DATE_TIME, R>;
