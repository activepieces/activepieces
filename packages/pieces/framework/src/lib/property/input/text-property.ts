import { BasePropertySchema, TPropertyValue } from "./common";
import { PropertyType } from "./property-type";

export type ShortTextProperty<R extends boolean> = BasePropertySchema &
    TPropertyValue<string, PropertyType.SHORT_TEXT, R>;

export type LongTextProperty<R extends boolean> = BasePropertySchema &
    TPropertyValue<string, PropertyType.LONG_TEXT, R>;
