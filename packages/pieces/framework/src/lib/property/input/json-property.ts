import { z } from "zod";
import { BasePropertySchema, TPropertyValue } from "./common";
import { PropertyType } from "./property-type";

export const JsonProperty = z.object({
  ...BasePropertySchema.shape,
  ...TPropertyValue(
    z.union([z.record(z.string(), z.unknown())]),
    PropertyType.JSON,
  ).shape,
});
export type JsonProperty<R extends boolean> = BasePropertySchema &
  TPropertyValue<
    Record<string, unknown>,
    PropertyType.JSON,
    R
  >;
