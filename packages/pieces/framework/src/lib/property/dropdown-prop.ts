import {  PropertyType } from "./property";
import { BasePropertySchema, TPropertyValue } from "./base-prop";
import { AnyProcessors } from "../processors/types";
import { AnyValidators } from "../validators/types";

export type DropdownState<T> = {
	disabled?: boolean;
	placeholder?: string;
	options: DropdownOption<T>[];
}

export type DropdownOption<T> = {
	label: string;
	value: T;
};

export type DynamicDropdownOptions<T> = (propsValue: Record<string, unknown>) => Promise<DropdownState<T>>

export type DropdownProperty<T, R extends boolean> = BasePropertySchema & {
	refreshers: string[];
	options: DynamicDropdownOptions<T>
} & TPropertyValue<T, AnyProcessors, AnyValidators, PropertyType.DROPDOWN, R>;

export type StaticDropdownProperty<T, R extends boolean> = BasePropertySchema & {
	options: DropdownState<T>;
} & TPropertyValue<T, AnyProcessors, AnyValidators, PropertyType.STATIC_DROPDOWN, R>;

export type MultiSelectDropdownProperty<T, R extends boolean> = BasePropertySchema & {
	refreshers: string[];
	options: DynamicDropdownOptions<T>
} & TPropertyValue<T[], AnyProcessors, AnyValidators, PropertyType.MULTI_SELECT_DROPDOWN, R>;

export type StaticMultiSelectDropdownProperty<T, R extends boolean> = BasePropertySchema & {
	options: DropdownState<T>;
} & TPropertyValue<T[], AnyProcessors, AnyValidators, PropertyType.STATIC_MULTI_SELECT_DROPDOWN, R>;
