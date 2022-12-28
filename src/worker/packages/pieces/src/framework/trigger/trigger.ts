import type {TriggerType} from './trigger-type';
import {Context} from "../context";
import {Property} from "../property/prop.model";

export class Trigger {
	// eslint-disable-next-line max-params
	constructor(
		public readonly name: string,
		public readonly displayName: string,
		public readonly description: string,
		public readonly props: Property[],
		public readonly type: TriggerType,
		public readonly onEnable: (context: Context) => Promise<void>,
		public readonly onDisable: (context: Context) => Promise<void>,
		public readonly run: (context: Context) => Promise<unknown[]>
	) {}

}


export function createTrigger(request: {
	name: string;
	displayName: string;
	description: string;
	props: Property[];
	type: TriggerType;
	onEnable: (context: Context) => Promise<void>;
	onDisable: (context: Context) => Promise<void>;
	run: (context: Context) => Promise<unknown[]>;
}): Trigger {
	return new Trigger(
		request.name,
		request.displayName,
		request.description,
		request.props,
		request.type,
		request.onEnable,
		request.onDisable,
		request.run
	);
}
