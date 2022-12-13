import type {ConfigurationValue} from './config/configuration-value.model';
import type {Input} from './config/input.model';
import type {Runner} from './runner';

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
	name: string;
	configs: Input[];
	runner: Runner;
}): Action {
	return new Action(request.configs, request.runner);
}
