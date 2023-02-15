import { PropertyType } from "@activepieces/shared";
import { BasePropertySchema, NumberProperty, SecretTextProperty, ShortTextProperty, TPropertyValue } from "./base-prop";
import { StaticDropdownProperty } from "./dropdown-prop";

export type OAuthProp = ShortTextProperty<true> | SecretTextProperty<true> | NumberProperty<true> | StaticDropdownProperty<any, true>;

export type OAuthPropValue = OAuthProp extends any ? OAuthProp['valueSchema'] : never;

export type OAuthPropsValue = Record<string, OAuthPropValue>;

export type OAuth2PropertySchema = BasePropertySchema & {
	props?: Record<string, OAuthProp>
	authUrl: string;
	tokenUrl: string;
	scope: string[];
	extra?: Record<string, unknown>
}

export type OAuth2PropertyValue = {
	access_token: string;
	props?: OAuthPropsValue,
	data: Record<string, any>;
}

export type OAuth2Property<R extends boolean> = OAuth2PropertySchema & TPropertyValue<
	OAuth2PropertyValue,
	PropertyType.OAUTH2,
	R
>;
