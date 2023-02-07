import { BasePropertySchema, PropertyType, TPropertyValue } from "./base-prop";


export type BasicAuthPropertySchema = BasePropertySchema & {
	username: {
		displayName: string;
		description?: string;
	};
	password: {
		displayName: string;
		description?: string;
	},
}

export type BasicAuthPropertyValue = {
	username: string;
	password: string,
}

export interface BasicAuthProperty extends BasicAuthPropertySchema, TPropertyValue<
	BasicAuthPropertyValue,
    PropertyType.BASIC_AUTH
> {}
