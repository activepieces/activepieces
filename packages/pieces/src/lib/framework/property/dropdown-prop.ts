import { BasePropertySchema, PropertyType, TPropertyValue } from "./base-prop";
import { OAuth2PropertyValue } from "./oauth2-prop";

export type DropdownState<T> = {
	disabled?: boolean;
	placeholder?: string;
	options: DropdownOption<T>[];
}

export type DropdownOption<T> = {
	label: string;
	value: T;
};

export type DropdownPropertySchema<T> = BasePropertySchema & {
	refreshers: string[];
	options: (propsValue: Record<string, OAuth2PropertyValue | number | string | DropdownState<any>>) => Promise<DropdownState<T>>
}

export interface DropdownProperty<T> extends DropdownPropertySchema<T>, TPropertyValue<T, PropertyType.DROPDOWN> {}
