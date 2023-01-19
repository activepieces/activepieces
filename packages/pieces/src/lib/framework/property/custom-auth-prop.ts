import { BasePropertySchema, PropertyType, SecretTextProperty, TPropertyValue } from "./base-prop";
import { DropdownProperty } from "./dropdown-prop";
import { OAuth2Property } from "./oauth-prop";

export type AuthProp = OAuth2Property | SecretTextProperty | DropdownProperty<string | number>;

export type AuthPropValue = AuthProp extends any ? AuthProp['valueSchema'] : never;

export type CustomAuthPropertySchema = BasePropertySchema & {
	props: Record<string, AuthProp>;
}

export type CustomAuthPropertyValue = Record<string, AuthPropValue>;

export interface CustomAuthProperty extends CustomAuthPropertySchema, TPropertyValue<
	CustomAuthPropertyValue,
	PropertyType.CUSTOM_AUTH
> {}
