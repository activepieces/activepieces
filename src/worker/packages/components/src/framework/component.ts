import {ActionNotFoundError} from './action/action-not-found-error';
import type {RunnerStatus} from './action/runner';
import type {ConfigurationValue} from './config/configuration-value.model';
import type {Trigger} from './trigger/trigger';
import {TriggerNotFoundError} from './trigger/trigger-not-found-error';
import {ConfigNotFoundError} from "./config/config-not-found-error";
import {SelectInput} from "./config/select-input.model";
import {Action} from "./action/action";

export class Component {
	private readonly _actions: Record<string, Action>;
	private readonly _triggers: Record<string, Trigger>;

	constructor(
		public readonly name: string,
		public readonly displayName: string,
		public readonly logoUrl: string,
		actions: Action[],
		triggers: Trigger[],
	) {
		this._actions = Object.fromEntries(
			actions.map(action => [action.name, action]),
		);

		this._triggers = Object.fromEntries(
			triggers.map(trigger => [trigger.name, trigger]),
		);
	}

	get actions(): Action[] {
		return Object.values(this._actions);
	}

	get triggers(): Trigger[] {
		return Object.values(this._triggers);
	}

	async runAction(actionName: string, config: ConfigurationValue): Promise<RunnerStatus> {
		if (!(actionName in this._actions)) {
			throw new ActionNotFoundError(this.name, actionName);
		}

		return this._actions[actionName].run(config);
	}

	async runConfigOptions(actionName: string, configName: string, config: ConfigurationValue){
		if (!(actionName in this._actions)) {
			throw new ActionNotFoundError(this.name, actionName);
		}
		let action = this._actions[actionName];
		let configIndex = action.configs.findIndex(f => f.name === configName);
		if(configIndex === -1){
			throw new ConfigNotFoundError(this.name, actionName, configName);
		}
		return await (action.configs[configIndex] as SelectInput).options(config);
	}

	getTrigger(triggerName: string): Trigger {
		if (!(triggerName in this._triggers)) {
			throw new TriggerNotFoundError(this.name, triggerName);
		}

		return this._triggers[triggerName];
	}

	metadata(){
		return {
			name: this.name,
			displayName: this.displayName,
			logoUrl: this.logoUrl,
			actions: this._actions,
			triggers: this._triggers
		}
	}
}

export const createComponent = (request: {
	name: string;
	displayName: string;
	logoUrl: string;
	actions: Action[];
	triggers: Trigger[];
}): Component => new Component(request.name, request.displayName, request.logoUrl, request.actions, request.triggers);
