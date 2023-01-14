import {Context} from "../context";
import {Property, PieceProperty, StaticPropsValue} from "../property/property";

class IAction<T extends PieceProperty> {
	constructor(
		public readonly name: string,
		public readonly displayName: string,
		public readonly description: string,
		public readonly props: T,
		public readonly run: (context: Context<StaticPropsValue<T>>) => Promise<unknown | void>,
	) {
	}
}

export type Action = IAction<any>;

export function createAction<T extends PieceProperty>(request: {
	name: string;
	displayName: string,
	description: string;
	props: T;
	run: (context: Context<StaticPropsValue<T>>) => Promise<unknown | void>;
}): Action {
	return new IAction(
		request.name,
		request.displayName,
		request.description,
		request.props,
		request.run
	);
}
