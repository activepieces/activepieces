import type {BasicInput} from './basic-input.model';
import type {InputOption} from './input-option.model';
import type {InputType} from './input-ui-type.model';
import {ConfigurationValue} from "./configuration-value.model";

export type SelectInput = BasicInput<InputType.SELECT> & {
	options: (auth: ConfigurationValue) => Promise<InputOption[]>;
};
