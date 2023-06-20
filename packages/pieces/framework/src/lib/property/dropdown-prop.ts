import { PieceAuthProperty, PiecePropValueSchema, PiecePropertyMap, PropertyType, StaticPropsValue } from "./property";
import { BasePropertySchema, TPropertyValue } from "./base-prop";

export type DropdownState<T> = {
	disabled?: boolean;
	placeholder?: string;
	options: DropdownOption<T>[];
}

export type DropdownOption<T> = {
	label: string;
	value: T;
};

export type DynamicDropdownOptionsContext = {
    auth: PiecePropValueSchema<PieceAuthProperty>
    propsValue: StaticPropsValue<PiecePropertyMap>
}

export type DynamicDropdownOptions<T> = (ctx: DynamicDropdownOptionsContext) => Promise<DropdownState<T>>

export type DropdownProperty<T, R extends boolean> = BasePropertySchema & {
	refreshers: string[];
	options: DynamicDropdownOptions<T>
} & TPropertyValue<T, PropertyType.DROPDOWN, R>;

export type StaticDropdownProperty<T, R extends boolean> = BasePropertySchema & {
	options: DropdownState<T>;
} & TPropertyValue<T, PropertyType.STATIC_DROPDOWN, R>;

export type MultiSelectDropdownProperty<T, R extends boolean> = BasePropertySchema & {
	refreshers: string[];
	options: DynamicDropdownOptions<T>
} & TPropertyValue<T[], PropertyType.MULTI_SELECT_DROPDOWN, R>;

export type StaticMultiSelectDropdownProperty<T, R extends boolean> = BasePropertySchema & {
	options: DropdownState<T>;
} & TPropertyValue<T[], PropertyType.STATIC_MULTI_SELECT_DROPDOWN, R>;
