import type {HttpMethod} from '../../common/http/core/http-method';
import type {ConfigurationValue} from '../config/configuration-value.model';
import type {Input} from '../config/input.model';
import type {Runner, RunnerStatus} from './runner';

export class Action {
	// eslint-disable-next-line max-params
	constructor(
		public readonly name: string,
		public readonly displayName: string,
		public readonly description: string,
		public readonly configs: Input[],
		private readonly runner: Runner,
	) {}

	async run(configValue: ConfigurationValue): Promise<RunnerStatus> {
		return this.runner(configValue);
	}
}

export function createAction(request: {
	name: string;
	displayName: string,
	description: string;
	configs: Input[];
	runner: Runner;
}): Action {
	return new Action(
		request.name,
		request.displayName,
		request.description,
		request.configs,
		request.runner,
	);
}
