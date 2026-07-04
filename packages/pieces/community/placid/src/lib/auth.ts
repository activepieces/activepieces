import { PieceAuth } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { PLACID_BASE_URL } from './common';

export const placidAuth = PieceAuth.SecretText({
	description: `
To obtain your Placid API token:

1. Log in to [placid.app](https://placid.app/login).
2. Go to Projects overview.
3. Select your desired project.
4. Click "API Tokens" in the left menu.
5. Copy your API token.

The token is project-specific and will only work with templates from that project.`,
	displayName: 'API Token',
	required: true,
	validate: async (auth) => {
		try {
			await httpClient.sendRequest({
				url: `${PLACID_BASE_URL}/templates`,
				method: HttpMethod.GET,
				authentication: {
					type: AuthenticationType.BEARER_TOKEN,
					token: auth.auth,
				},
			});
			return {
				valid: true,
			};
		} catch (e) {
			return {
				valid: false,
				error: 'Invalid API token or failed to connect to Placid API',
			};
		}
	},
});
