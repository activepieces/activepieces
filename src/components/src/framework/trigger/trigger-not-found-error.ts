export class TriggerNotFoundError extends Error {
	constructor(
		componentName: string,
		triggerName: string,
	) {
		super(`error=trigger_not_found component=${componentName} trigger=${triggerName}`);
	}
}
