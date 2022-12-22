export class ComponentNotFound extends Error {
	constructor(
		public readonly componentName: string
	) {
		super(`error= component=${componentName}`);
	}
}
