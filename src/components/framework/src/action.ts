import type {ConfigurationValue} from './model/configuration-value.model';
import {Input} from "./model/input.model";

export class Action {
	constructor(
		protected readonly configs: Input[],
		protected readonly runner: (configuration: ConfigurationValue) => unknown,
	) {}

	async run(configValue: ConfigurationValue): Promise<unknown> {
		return this.runner(configValue);
	}
}

export function createAction(request: {
	name: string,
	configs: Input[],
	runner: (configuration: ConfigurationValue) => unknown
}): Action {
	return new Action(request. configs, request.runner);
}