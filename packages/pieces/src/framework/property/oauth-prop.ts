import { BasePropertySchema, PropertyType, TPropertyValue } from "./base-prop";
import { AuthPropValue } from "./custom-auth-prop";

type OAuthUrlResolver = (propsValue: Record<string, AuthPropValue>) => Promise<string>;

export type OAuth2PropertySchema = BasePropertySchema & {
	authUrl: string | OAuthUrlResolver;
	tokenUrl: string | OAuthUrlResolver;
	scope: string[];
	extra?: Record<string, unknown>
}

export type OAuth2PropertyValue = {
	access_token: string;
	data: Record<string, any>;
}

export interface OAuth2Property extends OAuth2PropertySchema, TPropertyValue<
    OAuth2PropertyValue,
    PropertyType.OAUTH2
> {}
