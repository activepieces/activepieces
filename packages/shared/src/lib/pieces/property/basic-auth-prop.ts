
import { PropertyType } from "../model/property-type";
import { BasePropertySchema, TPropertyValue } from "./base-prop";


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

export type BasicAuthProperty<R extends boolean> = BasicAuthPropertySchema & TPropertyValue<
	BasicAuthPropertyValue,
    PropertyType.BASIC_AUTH,
	R
>;
