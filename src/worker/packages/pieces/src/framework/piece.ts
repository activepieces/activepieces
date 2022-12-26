import {ActionNotFoundError} from './action/action-not-found-error';
import type {RunnerStatus} from './action/runner';
import type {ConfigurationValue} from './config/configuration-value.model';
import type {Trigger} from './trigger/trigger';
import {Action} from "./action/action";

export class Piece {
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

	async runAction(actionName: string, config: ConfigurationValue): Promise<RunnerStatus> {
		if (!(actionName in this._actions)) {
			throw new ActionNotFoundError(this.name, actionName);
		}

		return this._actions[actionName].run(config);
	}

	getAction(actionName: string): Action | undefined {
		if (!(actionName in this._actions)) {
			return undefined;
		}
		return this._actions[actionName];
	}


	getTrigger(triggerName: string): Trigger | undefined {
		if (!(triggerName in this._triggers)) {
			return undefined;
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
}): Piece => new Piece(request.name, request.displayName, request.logoUrl, request.actions, request.triggers);
