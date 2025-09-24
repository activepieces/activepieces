import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';

export const teamworkAuth = PieceAuth.OAuth2({
	props: {
		subdomain: Property.ShortText({
			displayName: 'Subdomain',
			description: 'Your Teamwork site subdomain (e.g., mycompany for mycompany.teamwork.com)',
			required: true,
		}),
	},
	authUrl: 'https://{subdomain}.teamwork.com/launchpad/login',
	tokenUrl: 'https://www.teamwork.com/launchpad/v1/token.json',
	required: true,
	scope: [],
});

export type TeamworkAuth = {
	access_token: string;
	installation: {
		apiEndPoint: string;
	};
};


