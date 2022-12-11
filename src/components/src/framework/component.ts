import type {Action} from './action';
import {ActionNotFoundError} from './action-not-found-error';
import type {ConfigurationValue} from './config/configuration-value.model';

export class Component {
	private readonly actions: Record<string, Action>;

	constructor(
		public readonly name: string,
		public readonly logoUrl: string,
		actions: Action[],
	) {
		this.actions = Object.fromEntries(
			actions.map(action => [action.name, action]),
		);
	}

	async runAction(actionName: string, config: ConfigurationValue) {
		if (!(actionName in this.actions)) {
			throw new ActionNotFoundError(this.name, actionName);
		}

		return this.actions[actionName].run(config);
	}
}

export const createComponent = (request: {
	name: string;
	logoUrl: string;
	actions: Action[];
}): Component => new Component(request.name, request.logoUrl, request.actions);
