import { PropertyType } from "./property";
import { BasePropertySchema, TPropertyValue } from "./base-prop";
import { BasicAuthPropertyValue } from "./basic-auth-prop";
import { OAuth2PropertyValue } from "./oauth2-prop";

export type DropdownState<T> = {
	disabled?: boolean;

}

export type DropdownOption<T> = {
	label: string;
	value: T;
};

// MainDropdownState extends DropdownState and adds placeholder and options
export type MainDropdownState<T> = DropdownState<T> & {
	placeholder?: string;
	options: DropdownOption<T>[];
  };


export type DropdownProperty<T, R extends boolean> = BasePropertySchema & {
	refreshers: string[];
	options: (propsValue: Record<string, undefined | OAuth2PropertyValue | number | string | object | BasicAuthPropertyValue | unknown[]>) => Promise<MainDropdownState<T>>
} & TPropertyValue<T, PropertyType.DROPDOWN, R>;

export type StaticDropdownProperty<T, R extends boolean> = BasePropertySchema & {
	options: MainDropdownState<T>;
} & TPropertyValue<T, PropertyType.STATIC_DROPDOWN, R>;

export type MultiSelectDropdownProperty<T, R extends boolean> = BasePropertySchema & {
	refreshers: string[];
	options: (propsValue: Record<string, OAuth2PropertyValue | number | string | object | BasicAuthPropertyValue | unknown[]>) => Promise<MainDropdownState<T>>
} & TPropertyValue<T[], PropertyType.MULTI_SELECT_DROPDOWN, R>;

export type StaticMultiSelectDropdownProperty<T, R extends boolean> = BasePropertySchema & {
	options: MainDropdownState<T>[];
} & TPropertyValue<T[], PropertyType.STATIC_MULTI_SELECT_DROPDOWN, R>;
