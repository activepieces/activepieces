import { DropdownItemOption } from './dropdown-item-option';

export enum Oauth2UserInputType {
	LOGIN = 'LOGIN',
	APP_DETAILS = 'APP_DETAILS',
	EVERYTHING = 'EVERYTHING',
}

export const OAuth2UserInputTypeDropdownOptions: DropdownItemOption[] = [
	{ label: 'Ask for login', value: Oauth2UserInputType.LOGIN },
	{ label: 'Ask for everything', value: Oauth2UserInputType.EVERYTHING },
	{ label: 'Ask for app details', value: Oauth2UserInputType.APP_DETAILS },
];
