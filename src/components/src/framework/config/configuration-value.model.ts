export type ConfigurationValue = {
	inputs: Record<string, string>;
	authentication: {
		accessToken: string;
		clientId?: string;
		clientSecret?: string;
		refreshToken?: string;
	};
};
