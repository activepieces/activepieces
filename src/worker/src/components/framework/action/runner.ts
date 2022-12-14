import type {ConfigurationValue} from '../config/configuration-value.model';
import {Worker} from "../worker";

export type RunnerStatus = {
	success: boolean;
};

export type Runner = (worker: Worker, config: ConfigurationValue) => Promise<RunnerStatus>;
