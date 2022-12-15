import type {BasicInput} from './basic-input.model';
import type {InputOption} from './input-option.model';
import {ConfigurationValue} from "./configuration-value.model";
import {InputType} from "./input-type.model";

export type SelectInput = BasicInput<InputType.SELECT> & {
	options: (auth: ConfigurationValue) => Promise<InputOption[]>;
};
