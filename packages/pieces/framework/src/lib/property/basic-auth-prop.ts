import { PropertyType } from "./property";
import { BasePropertySchema, TPropertyValue } from "./base-prop";
import { StringValidators } from "../validators/types";


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
	never,
	StringValidators,
	PropertyType.BASIC_AUTH,
	R
>;
