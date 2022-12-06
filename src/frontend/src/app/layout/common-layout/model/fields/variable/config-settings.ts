import { Oauth2UserInputType } from './subfields/oauth2-user-input.type';

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
	userInputType: Oauth2UserInputType = Oauth2UserInputType.LOGIN;
	responseType: string = 'code';
}
