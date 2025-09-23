import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, HttpMethod, httpClient } from '@activepieces/pieces-common';

export const teamworkAuth = PieceAuth.CustomAuth({
	props: {
		apiKey: Property.ShortText({
			displayName: 'API Key',
			description: 'Teamwork API key. If not provided, TEAMWORK_API_KEY env var will be used.',
			required: false,
		}),
		subdomain: Property.ShortText({
			displayName: 'Subdomain',
			description: 'Your Teamwork site subdomain (e.g., mycompany for mycompany.teamwork.com). If not provided, TEAMWORK_SUBDOMAIN env var will be used.',
			required: false,
		}),
 	},
	displayName: 'Teamwork API',
	description: 'Authenticate using your Teamwork API key and subdomain.',
	required: true,
	validate: async ({ auth }) => {
 		const apiKey = (auth as any)?.apiKey || process.env.TEAMWORK_API_KEY;
 		const subdomain = (auth as any)?.subdomain || process.env.TEAMWORK_SUBDOMAIN;
 		if (!apiKey || !subdomain) {
 			return { valid: false, error: 'Missing API Key or Subdomain (set in piece or env).' };
 		}
 		try {
 			await httpClient.sendRequest({
 				method: HttpMethod.GET,
 				url: `https://${subdomain}.teamwork.com/me.json`,
 				authentication: {
 					type: AuthenticationType.BASIC,
 					username: apiKey,
 					password: 'x',
 				},
 			});
 			return { valid: true };
 		} catch (e) {
 			return { valid: false, error: 'Invalid Teamwork credentials.' };
 		}
 	},
});

export type TeamworkAuth = { apiKey?: string; subdomain?: string };


