import { z } from "zod";
import { BasePropertySchema, TPropertyValue } from "./common";
import { PropertyType } from "./property-type";

export const ObjectProperty = z.object({
    ...BasePropertySchema.shape,
    ...TPropertyValue(
        z.record(z.string(), z.unknown()),
        PropertyType.OBJECT,
    ).shape,
})

export type ObjectProperty<R extends boolean> = BasePropertySchema &
    TPropertyValue<
        Record<string, unknown>,
        PropertyType.OBJECT,
        R
    >;
