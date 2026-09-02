import { BasePropertySchema, TPropertyValue } from "./common";
import { PropertyType } from "./property-type";

export type JsonProperty<R extends boolean> = BasePropertySchema &
  TPropertyValue<
    Record<string, unknown>,
    PropertyType.JSON,
    R
  >;
