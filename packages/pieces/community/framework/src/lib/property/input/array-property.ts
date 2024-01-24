import { Type } from "@sinclair/typebox";
import { BasePropertySchema, TPropertyValue } from "./common";
import { PropertyType } from "./property-type";
import { ValidationInputType } from "../../validators/types";
import { LongTextProperty, ShortTextProperty } from "./text-property";
import { StaticDropdownProperty, StaticMultiSelectDropdownProperty } from "./dropdown/static-dropdown";
import { MultiSelectDropdownProperty } from "./dropdown/dropdown-prop";
import { CheckboxProperty } from "./checkbox-property";
import { NumberProperty } from "./number-property";

export const ArrayProperty = Type.Composite([
    BasePropertySchema,
    Type.Object({
        properties: Type.Optional(Type.Record(Type.String(), Type.Union([
            ShortTextProperty,
            LongTextProperty,
            StaticDropdownProperty,
            MultiSelectDropdownProperty,
            StaticMultiSelectDropdownProperty,
            CheckboxProperty,
            NumberProperty
        ])))
    }),
    TPropertyValue(Type.Array(Type.Unknown()), PropertyType.ARRAY)
])

export type ArrayProperty<R extends boolean> = BasePropertySchema &
{
    properties?: Record<
        string,
        | ShortTextProperty<R>
        | LongTextProperty<R>
        | StaticDropdownProperty<any, R>
        | MultiSelectDropdownProperty<any, R>
        | StaticMultiSelectDropdownProperty<any, R>
        | CheckboxProperty<R>
        | NumberProperty<R>
    >;
} & TPropertyValue<unknown[], PropertyType.ARRAY, ValidationInputType.ARRAY, R>;