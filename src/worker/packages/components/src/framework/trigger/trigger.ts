import type {TriggerType} from './trigger-type';
import {ConfigurationValue} from "../config/configuration-value.model";
import {HttpMethod} from "../../common/http/core/http-method";
import {Input} from "../config/input.model";
import {Runner, RunnerStatus} from "../action/runner";
import {Context} from "../context";

export class Trigger {
	// eslint-disable-next-line max-params
	constructor(
		public readonly name: string,
		public readonly description: string,
		public readonly configs: Input[],
		public readonly type: TriggerType,
		public readonly onEnable: (context: Context) => Promise<void>,
		public readonly onDisable: (context: Context) => Promise<void>,
		public readonly run: (context: Context) => Promise<unknown[]>
	) {}

}


export function createTrigger(request: {
	name: string;
	description: string;
	configs: Input[];
	type: TriggerType;
	onEnable: (context: Context) => Promise<void>;
	onDisable: (context: Context) => Promise<void>;
	run: (context: Context) => Promise<unknown[]>;
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
