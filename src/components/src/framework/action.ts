import type {ConfigurationValue} from './config/configuration-value.model';
import type {Input} from './config/input.model';
import type {Runner, RunnerStatus} from './runner';

export class Action {
	constructor(
		public readonly name: string,
		public readonly configs: Input[],
		private readonly runner: Runner,
	) {}

	async run(configValue: ConfigurationValue): Promise<RunnerStatus> {
		return this.runner(configValue);
	}
}

export function createAction(request: {
	name: string;
	configs: Input[];
	runner: Runner;
}): Action {
	return new Action(request.name, request.configs, request.runner);
}
