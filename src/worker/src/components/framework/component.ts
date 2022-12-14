import type {Action} from './action/action';
import {ActionNotFoundError} from './action/action-not-found-error';
import type {RunnerStatus} from './action/runner';
import type {ConfigurationValue} from './config/configuration-value.model';
import type {Trigger} from './trigger/trigger';
import {TriggerNotFoundError} from './trigger/trigger-not-found-error';

export class Component {
	private readonly _actions: Record<string, Action>;
	private readonly _triggers: Record<string, Trigger>;

	constructor(
		public readonly name: string,
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

	getTrigger(triggerName: string): Trigger {
		if (!(triggerName in this._triggers)) {
			throw new TriggerNotFoundError(this.name, triggerName);
		}

		return this._triggers[triggerName];
	}

	metadata(){
		return {
			name: this.name,
			logoUrl: this.logoUrl,
			actions: this._actions,
			triggers: this._triggers
		}
	}
}

export const createComponent = (request: {
	name: string;
	logoUrl: string;
	actions: Action[];
	triggers: Trigger[];
}): Component => new Component(request.name, request.logoUrl, request.actions, request.triggers);
