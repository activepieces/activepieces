import { Type } from "@sinclair/typebox";
import { BasePropertySchema, TPropertyValue } from "./common";
import { PropertyType } from "./property-type";

export const JsonProperty = Type.Composite([
  BasePropertySchema,
  TPropertyValue(
    Type.Union([Type.Record(Type.String(), Type.Unknown())]),
    PropertyType.JSON,
  ),
]);
export type JsonProperty<R extends boolean> = BasePropertySchema &
  TPropertyValue<
    Record<string, unknown>,
    PropertyType.JSON,
    R
  >;
