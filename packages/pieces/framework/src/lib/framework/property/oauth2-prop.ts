import { PropertyType } from "@activepieces/shared";
import { BasePropertySchema, SecretTextProperty, ShortTextProperty, TPropertyValue } from "./base-prop";
import { DropdownProperty } from "./dropdown-prop";

export type OAuthProp = OAuth2Property | ShortTextProperty | SecretTextProperty | DropdownProperty<any>;

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

export interface OAuth2Property extends OAuth2PropertySchema, TPropertyValue<
    OAuth2PropertyValue,
    PropertyType.OAUTH2
> {}
