import { UUID } from 'angular2-uuid';
import { Oauth2UserInputType } from './oauth2-user-input.type';

export interface Oauth2LoginSettingsInterface {
	userInputType: Oauth2UserInputType;
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
		userInputType: Oauth2UserInputType;
	};
}
