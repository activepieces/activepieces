export class ActionNotFoundError extends Error {
	constructor(
		pieceName: string,
		actionName: string,
	) {
		super(`error=action_not_found component=${pieceName} action=${actionName}`);
	}
}
