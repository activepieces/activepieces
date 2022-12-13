import { InputUiType } from '@activepieces/components';

import { from, Observable } from 'rxjs';
import { DropdownItemOption } from '../../../model/fields/variable/subfields/dropdown-item-option';
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
	type: InputUiType;
	label: string;
	value: any;
	description?: string;
	required: boolean;
	options?: Observable<DropdownItemOption[]>;
}
export class ComponnentConfigsForActionsOrTriggers {
	name: string;
	description: string;
	url: string;
	httpMethod: HttpMethod;
	uiType: InputUiType;
	required: boolean;
	displayName: string;
	options?: (accessToken: string) => Promise<DropdownItemOption[]>;
	static convertToFrontEndConfig(componentConfig: ComponnentConfigsForActionsOrTriggers, accessToken: string) {
		const frontEndConfig = new FrontEndConnectorConfig();
		frontEndConfig.description = componentConfig.description;
		frontEndConfig.key = componentConfig.name;
		frontEndConfig.label = componentConfig.displayName;
		frontEndConfig.required = componentConfig.required;

		frontEndConfig.type = componentConfig.uiType as any;
		if (componentConfig.options) {
			frontEndConfig.options = from(componentConfig.options(accessToken));
		}
		return frontEndConfig;
	}
}

export class ConnectorComponent {
	name: string;
	logoUrl: string;
	actions: {
		name: string;
		description: string;
		url: string;
		httpMethod: HttpMethod;
		configs: ComponnentConfigsForActionsOrTriggers[];
	}[];
}
