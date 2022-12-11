import type {Action} from './action/action';
import {ActionNotFoundError} from './action/action-not-found-error';
import type {RunnerStatus} from './action/runner';
import type {ConfigurationValue} from './config/configuration-value.model';
import type {Trigger} from './trigger/trigger';
import {TriggerNotFoundError} from './trigger/trigger-not-found-error';

export class Component {
	private readonly actions: Record<string, Action>;
	private readonly triggers: Record<string, Trigger>;

	constructor(
		public readonly name: string,
		public readonly logoUrl: string,
		actions: Action[],
		triggers: Trigger[],
	) {
		this.actions = Object.fromEntries(
			actions.map(action => [action.name, action]),
		);

		this.triggers = Object.fromEntries(
			triggers.map(trigger => [trigger.name, trigger]),
		);
	}

	async runAction(actionName: string, config: ConfigurationValue): Promise<RunnerStatus> {
		if (!(actionName in this.actions)) {
			throw new ActionNotFoundError(this.name, actionName);
		}

		return this.actions[actionName].run(config);
	}

	getTrigger(triggerName: string): Trigger {
		if (!(triggerName in this.triggers)) {
			throw new TriggerNotFoundError(this.name, triggerName);
		}

		return this.triggers[triggerName];
	}
}

export const createComponent = (request: {
	name: string;
	logoUrl: string;
	actions: Action[];
	triggers: Trigger[];
}): Component => new Component(request.name, request.logoUrl, request.actions, request.triggers);
