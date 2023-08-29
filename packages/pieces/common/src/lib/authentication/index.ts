export type Authentication = BearerTokenAuthentication | ApiKeyAuthentication | BasicAuthentication;

export enum AuthenticationType {
	API_KEY = 'API_KEY',
	BEARER_TOKEN = 'BEARER_TOKEN',
	BASIC = "BASIC"
}

export type BaseAuthentication<T extends AuthenticationType> = {
	type: T;
};

export type BearerTokenAuthentication = BaseAuthentication<AuthenticationType.BEARER_TOKEN> & {
	token: string;
};

export type ApiKeyAuthentication = BaseAuthentication<AuthenticationType.API_KEY> & {
	apiKey: string;
};

export type BasicAuthentication = BaseAuthentication<AuthenticationType.BASIC> & {
	username: string;
	password: string;
};
