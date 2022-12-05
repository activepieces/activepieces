import { RequestType } from '../../common-layout/components/form-controls/ng-select-connector-action-item-template/requestType.enum';
import { ConfigSource } from '../../common-layout/model/enum/config-source';
import { ConfigType } from '../../common-layout/model/enum/config.enum';
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
			hintText: actionInput.description,
			type: actionInput.uiType,
			settings: {
				required: actionInput.required,
			},
			source: ConfigSource.USER,
			value: null,
		};
		return config;
	}
	static convertManifestSecurityToAuthConfigSettings(security: ManifestSecurity) {
		const authConfigSettings = {
			tokenUrl: security.oauth2.tokenUrl,
			scope: security.oauth2.scopes.join(' '),
			authUrl: security.oauth2.authUrl,
			responseType: security.oauth2.responseType,
		} as OAuth2ConfigSettings;
		return authConfigSettings;
	}
}
