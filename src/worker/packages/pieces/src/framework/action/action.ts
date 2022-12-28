import {Context} from "../context";
import {Property} from "../property/prop.model";
export class Action {
	// eslint-disable-next-line max-params
	constructor(
		public readonly name: string,
		public readonly displayName: string,
		public readonly description: string,
		public readonly props: Property[],
		public readonly run: (context: Context) => Promise<unknown>,
	) {}

}

export function createAction(request: {
	name: string;
	displayName: string,
	description: string;
	props: Property[];
	run: (context: Context) => Promise<unknown>;
}): Action {
	return new Action(
		request.name,
		request.displayName,
		request.description,
		request.props,
		request.run,
	);
}
