import { PropertyType } from "@activepieces/shared";
import { BasePropertySchema, TPropertyValue } from "./base-prop";
import { BasicAuthPropertyValue } from "./basic-auth-prop";
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

type DropdownPropertySchema<T> = BasePropertySchema & {
	refreshers: string[];
	options: (propsValue: Record<string, OAuth2PropertyValue | number | string | DropdownState<any> | BasicAuthPropertyValue>) => Promise<DropdownState<T>>
}

export type DropdownProperty<T, R extends boolean> =  DropdownPropertySchema<T> & TPropertyValue<T, PropertyType.DROPDOWN, R>;
