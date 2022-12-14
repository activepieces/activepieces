import type {InputType} from './input-ui-type.model';

export type BasicInput<U extends InputType> = {
	name: string;
	displayName: string;
	description: string | undefined;
	required: boolean;
	type: U;
};
