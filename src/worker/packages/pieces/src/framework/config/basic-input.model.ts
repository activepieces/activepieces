import {InputType} from "./input-type.model";

export type BasicInput<U extends InputType> = {
	name: string;
	displayName: string;
	description: string | undefined;
	required: boolean;
	type: U;
};
