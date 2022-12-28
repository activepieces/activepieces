import {Context} from "../context";
import {Property, PropertySchema, StaticPropsValue} from "../property/prop.model";

class IAction<T extends PropertySchema> {
	constructor(
		public readonly name: string,
		public readonly displayName: string,
		public readonly description: string,
		public readonly props: T,
		public readonly run: (context: Context<StaticPropsValue<T>>) => Promise<unknown>,
	) {
	}
}

export type Action = IAction<any>;

export function createAction<T extends PropertySchema>(request: {
	name: string;
	displayName: string,
	description: string;
	props: T;
	run: (context: Context<StaticPropsValue<T>>) => Promise<unknown>;
}): Action {
	return new IAction(
		request.name,
		request.displayName,
		request.description,
		request.props,
		request.run
	);
}
