export class OAuth2ConfigSettings {
	authUrl: string = '';
	tokenUrl: string = '';
	refreshUrl: string = '';
	clientId: string = '';
	scope: string = '';
	clientSecret: string = '';
	configParent?: {
		configKey: string;
	};
	responseType: string = 'code';
}
