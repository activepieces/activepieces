export enum HttpMethod {
	CONNECT = 'CONNECT',
	DELETE = 'DELETE',
	GET = 'GET',
	HEAD = 'HEAD',
	OPTIONS = 'OPTIONS',
	PATCH = 'PATCH',
	POST = 'POST',
	PUT = 'PUT',
	TRACE = 'TRACE',
}

export class FrontEndConnectorConfig {
	key: string;
	type: InputType;
	label: string;
	value: any;
	description?: string;
	required: boolean;
}
export class ComponnentConfigsForActionsOrTriggers {
	name: string;
	description: string;
	url: string;
	httpMethod: HttpMethod;
	type: InputType;
	required: boolean;
	displayName: string;
	static convertToFrontEndConfig(componentConfig: ComponnentConfigsForActionsOrTriggers) {
		const frontEndConfig = new FrontEndConnectorConfig();
		frontEndConfig.description = componentConfig.description;
		frontEndConfig.key = componentConfig.name;
		frontEndConfig.label = componentConfig.displayName;
		frontEndConfig.required = componentConfig.required;
		frontEndConfig.type = componentConfig.type;
		return frontEndConfig;
	}
}

export class ConnectorComponent {
	name: string;
	logoUrl: string;
	actions: Record<
		string,
		{
			name: string;
			description: string;
			configs: ComponnentConfigsForActionsOrTriggers[];
		}
	>;
}
export enum InputType {
	SHORT_TEXT = 'SHORT_TEXT',
	LONG_TEXT = 'LONG_TEXT',
	SELECT = 'SELECT',
	NUMBER = 'NUMBER',
	CHECKBOX = 'CHECKBOX',
	JSON = 'JSON',
	OAUTH2 = 'OAUTH2',
}
