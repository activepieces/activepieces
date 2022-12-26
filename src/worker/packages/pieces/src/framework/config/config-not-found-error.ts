export class ConfigNotFoundError extends Error {
	constructor(
		componentName: string,
		actionName: string,
		configName: string
	) {
		super(`error=config_not_found component=${componentName} action=${actionName} configName=${configName}`);
	}
}
