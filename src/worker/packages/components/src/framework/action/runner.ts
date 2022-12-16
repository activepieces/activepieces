import type {ConfigurationValue} from '../config/configuration-value.model';

export type RunnerStatus = {
	success: boolean;
};

export type Runner = (config: ConfigurationValue) => Promise<RunnerStatus>;
