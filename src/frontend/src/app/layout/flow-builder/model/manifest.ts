import { RequestType } from '../../common-layout/components/form-controls/ng-select-connector-action-item-template/requestType.enum';
import { ConfigType } from '../../common-layout/model/enum/config-type';
import { Config } from '../../common-layout/model/fields/variable/config';
import { OAuth2ConfigSettings } from '../../common-layout/model/fields/variable/config-settings';

type ActionInput = {
	name: string;
	description: string;
	url: string;
	displayName: string;
	uiType: ConfigType;
	required: boolean;
};

type ManifestSecurity = {
	oauth2: {
		type: string;
		tokenUrl: string;
		responseType: string;
		authUrl: string;
		scopes: string[];
	};
};

export class Manifest {
	baseUrl: string;
	version: string;
	security: ManifestSecurity;
	actions: {
		name: string;
		description: string;
		method: RequestType;
		inputs: ActionInput[];
		url: string;
		summary: string;
	}[];
	name: string;
	public static getConfigsForAction(actionInputs: ActionInput[]): Config[] {
		return actionInputs.map(i => Manifest.convertActionInputToConfig(i));
	}
	static convertActionInputToConfig(actionInput: ActionInput): Config {
		//TODO figure out static dropdowns options
		const config: Config = {
			key: actionInput.name,
			label: actionInput.displayName,
			type: actionInput.uiType,
			value: null,
		};
		return config;
	}
	static convertManifestSecurityToAuthConfigSettings(security: ManifestSecurity) {
		const authConfigSettings = {
			token_url: security.oauth2.tokenUrl,
			scope: security.oauth2.scopes.join(' '),
			auth_url: security.oauth2.authUrl,
			response_type: security.oauth2.responseType,
		} as OAuth2ConfigSettings;
		return authConfigSettings;
	}
}
