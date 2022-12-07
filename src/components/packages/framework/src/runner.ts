import type {ConfigurationValue} from './model/configuration-value.model';
import type {RunnerStatus} from './model/runner-status.model';

export abstract class Runner {
	/**
	 * Implements the steps of a particular action.
	 * @param configValue input values as provided by the user
	 */
	abstract execute(configValue: ConfigurationValue): Promise<RunnerStatus>;
}
