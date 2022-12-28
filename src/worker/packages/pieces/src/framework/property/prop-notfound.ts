export class PropNotfound extends Error {
	constructor(
		pieceName: string,
		actionName: string,
		configName: string
	) {
		super(`error=config_not_found pieceName=${pieceName} action=${actionName} configName=${configName}`);
	}
}
