import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';

export const teamworkAuth = PieceAuth.CustomAuth({
	description: `
	Enter your Teamwork username (email address) and password.
	`,
	props: {
		username: Property.ShortText({
			displayName: 'Username',
			description: 'Your Teamwork email address.',
			required: true,
		}),
		password: PieceAuth.SecretText({
			displayName: 'Password',
			required: true,
		}),
		subdomain: Property.ShortText({
			displayName: 'Subdomain',
			description: 'Your Teamwork site subdomain (e.g., mycompany for mycompany.teamwork.com)',
			required: true,
		}),
	},
	validate: async ({ auth }) => {
		try {
			await httpClient.sendRequest({
				method: HttpMethod.GET,
				url: `https://${auth.subdomain}.teamwork.com/projects.json`,
				authentication: {
					type: AuthenticationType.BASIC,
					username: auth.username,
					password: auth.password,
				},
			});
			return {
				valid: true,
			};
		} catch (e) {
			return {
				valid: false,
				error: 'Invalid username, password, or subdomain.',
			};
		}
	},
	required: true,
});

export type TeamworkAuth = {
	access_token: string;
	installation: {
		apiEndPoint: string;
	};
};


