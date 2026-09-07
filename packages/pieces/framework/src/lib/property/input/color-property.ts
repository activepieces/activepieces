import { BasePropertySchema, TPropertyValue } from "./common";
import { PropertyType } from "./property-type";

export type ColorProperty<R extends boolean> = BasePropertySchema &
    TPropertyValue<string, PropertyType.COLOR, R>;
