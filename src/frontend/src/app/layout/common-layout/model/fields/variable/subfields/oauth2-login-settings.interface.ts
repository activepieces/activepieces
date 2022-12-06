import { UUID } from 'angular2-uuid';

export interface Oauth2LoginSettingsInterface {
	scope: string;
	clientId: string;
	clientSecret: string;
	authUrl: string;
	tokenUrl: string;
	refreshUrl: string;
	responseType: string;
	configParent?: {
		flowId: UUID;
		configKey: string;
	};
}
