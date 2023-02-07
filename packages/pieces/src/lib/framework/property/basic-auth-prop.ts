import { BasePropertySchema, PropertyType, SecretTextProperty, ShortTextProperty, TPropertyValue } from "./base-prop";


export type BasicAuthPropertySchema = BasePropertySchema & {
	username: ShortTextProperty;
	password: SecretTextProperty,
}

export type BasicAuthPropertyValue = {
	username: string;
	password: string,
}

export interface BasicAuthProperty extends BasicAuthPropertySchema, TPropertyValue<
	BasicAuthPropertyValue,
    PropertyType.BASIC_AUTH
> {}
