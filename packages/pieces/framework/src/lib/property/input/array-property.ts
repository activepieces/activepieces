import { z } from "zod";
import { BasePropertySchema, TPropertyValue } from "./common";
import { PropertyType } from "./property-type";
import { LongTextProperty, ShortTextProperty } from "./text-property";
import { StaticDropdownProperty, StaticMultiSelectDropdownProperty } from "./dropdown/static-dropdown";
import { MultiSelectDropdownProperty } from "./dropdown/dropdown-prop";
import { CheckboxProperty } from "./checkbox-property";
import { NumberProperty } from "./number-property";
import { FileProperty } from "./file-property";
import { JsonProperty } from './json-property';
import { ColorProperty } from "./color-property";
import { DateTimeProperty } from './date-time-property';

export const ArraySubProps = z.record(z.string(), z.union([
    ShortTextProperty,
    LongTextProperty,
    StaticDropdownProperty,
    MultiSelectDropdownProperty,
    StaticMultiSelectDropdownProperty,
    CheckboxProperty,
    NumberProperty,
    FileProperty,
    DateTimeProperty,
]))

export const ArrayProperty = z.object({
    ...BasePropertySchema.shape,
    properties: ArraySubProps,
    ...TPropertyValue(z.array(z.unknown()), PropertyType.ARRAY).shape,
})

export type ArraySubProps<R extends boolean> = Record<
    string,
    | ShortTextProperty<R>
    | LongTextProperty<R>
    | StaticDropdownProperty<unknown, R>
    | MultiSelectDropdownProperty<unknown, R>
    | StaticMultiSelectDropdownProperty<unknown, R>
    | CheckboxProperty<R>
    | NumberProperty<R>
    | FileProperty<R>
    | JsonProperty<R>
    | ColorProperty<R>
    | DateTimeProperty<R>
>;

export type ArrayProperty<R extends boolean> = BasePropertySchema &
{
    properties?: ArraySubProps<R>;
} & TPropertyValue<unknown[], PropertyType.ARRAY, R>;
