import { PieceAuth } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';

export const dumplingAuth = PieceAuth.SecretText({
	displayName: 'API Key',
	required: true,
	description: `To get your API key:
1. Sign in to [Dumpling AI](https://app.dumplingai.com).
2. Open the [API Keys](https://app.dumplingai.com/api-keys) page.
3. Create a key, copy it and paste it here.`,
	validate: async ({ auth }) => {
		try {
			await httpClient.sendRequest({
				url: 'https://app.dumplingai.com/api/v1/search',
				method: HttpMethod.POST,
				authentication: {
					type: AuthenticationType.BEARER_TOKEN,
					token: auth,
				},
				body: {
					query: 'Activepieces',
				},
			});

			return {
				valid: true,
			};
		} catch (e) {
			return { valid: false, error: 'Invalid API Key.' };
		}
	},
});
