import { BasePropertySchema, TPropertyValue } from "./common";
import { PropertyType } from "./property-type";

export type ObjectProperty<R extends boolean> = BasePropertySchema &
    TPropertyValue<
        Record<string, unknown>,
        PropertyType.OBJECT,
        R
    >;
