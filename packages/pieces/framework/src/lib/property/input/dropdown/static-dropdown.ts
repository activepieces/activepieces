import { BasePropertySchema, TPropertyValue } from "../common";
import { DropdownState } from "./common";
import { PropertyType } from "../property-type";

export type StaticDropdownDisplay = 'cards'

export type StaticDropdownProperty<
    T,
    R extends boolean
> = BasePropertySchema & {
    options: DropdownState<T>;
    display?: StaticDropdownDisplay;
} & TPropertyValue<T, PropertyType.STATIC_DROPDOWN, R>;

export type StaticMultiSelectDropdownProperty<
    T,
    R extends boolean
> = BasePropertySchema & {
    options: DropdownState<T>;
} & TPropertyValue<
    T[],
    PropertyType.STATIC_MULTI_SELECT_DROPDOWN,
    R
>;
