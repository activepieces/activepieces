import { PropertyType } from "./property";

import { BasePieceAuthSchema, SecretTextProperty, ShortTextProperty, TPropertyValue } from "./base-prop";
import { StaticDropdownProperty } from "./dropdown-prop";
import { StaticPropsValue } from "./property";
import { ValidationInputType } from "../validators/types";
import { OAuth2GrantType } from "@activepieces/shared";

type OAuthProp = ShortTextProperty<true> | SecretTextProperty<true> | StaticDropdownProperty<any, true>;

export interface OAuth2Props {
	[name: string]: ShortTextProperty<boolean> | SecretTextProperty<boolean> | StaticDropdownProperty<unknown, boolean>;
}

export type OAuthPropsValue<T extends OAuth2Props> = StaticPropsValue<T>;

export type OAuth2PropertySchema = BasePieceAuthSchema<OAuth2PropertyValue> & {
	props?: Record<string, OAuthProp>
	authUrl: string;
	tokenUrl: string;
	scope: string[];
	pkce?: boolean;
	authorizationMethod?: OAuth2AuthorizationMethod,
	grantType?: OAuth2GrantType;
	extra?: Record<string, unknown>;
}

export type OAuth2PropertyValue<T extends OAuth2Props = any> = {
	access_token: string;
	props?: OAuthPropsValue<T>,
	data: Record<string, any>;
}

export type OAuth2Property<R extends boolean, T extends OAuth2Props> = OAuth2PropertySchema & TPropertyValue<
	OAuth2PropertyValue<T>,
	PropertyType.OAUTH2,
	ValidationInputType.ANY,
	R
>;

export enum OAuth2AuthorizationMethod {
	HEADER = "HEADER",
	BODY = "BODY"
}
