export class ActionNotFoundError extends Error {
	constructor(
		componentName: string,
		actionName: string,
	) {
		super(`error=action_not_found component=${componentName} action=${actionName}`);
	}
}
