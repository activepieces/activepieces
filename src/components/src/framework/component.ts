import type {Action} from './action';

export class Component {
	constructor(
		protected readonly name: string,
		protected readonly logoUrl: string,
		protected readonly actions: Action[],
	) {}
}

export function createComponent(request: {
	name: string;
	logoUrl: string;
	actions: Action[];
}): Component {
	return new Component(request.name, request.logoUrl, request.actions);
}
