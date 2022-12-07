import type {ConfigurationValue} from './model/configuration-value.model';
import type {Configuration} from './model/configuration.model';
import type {RunnerStatus} from './model/runner-status.model';
import type {Runner} from './runner';

export abstract class Action {
	constructor(
		protected readonly config: Configuration,
		protected readonly runner: Runner,
	) {}

	async run(configValue: ConfigurationValue): Promise<RunnerStatus> {
		return this.runner.execute(configValue);
	}
}
