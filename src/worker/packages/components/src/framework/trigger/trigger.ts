import type {TriggerType} from './trigger-type';
import {ConfigurationValue} from "../config/configuration-value.model";
import {HttpMethod} from "../../common/http/core/http-method";
import {Input} from "../config/input.model";
import {Runner, RunnerStatus} from "../action/runner";

export class Trigger {
	// eslint-disable-next-line max-params
	constructor(
		public readonly name: string,
		public readonly description: string,
		public readonly configs: Input[],
		public readonly type: TriggerType,
		public readonly onEnable: (config: ConfigurationValue) => Promise<void>,
		public readonly onDisable: (config: ConfigurationValue) => Promise<void>,
		public readonly run: (config: ConfigurationValue) => Promise<Record<string, any>[]>
	) {}

}


export function createTrigger(request: {
	name: string;
	description: string;
	configs: Input[];
	type: TriggerType;
	onEnable: (config: ConfigurationValue) => Promise<void>;
	onDisable: (config: ConfigurationValue) => Promise<void>;
	run: (config: ConfigurationValue) => Promise<Record<string, any>[]>;
}): Trigger {
	return new Trigger(
		request.name,
		request.description,
		request.configs,
		request.type,
		request.onEnable,
		request.onDisable,
		request.run
	);
}
