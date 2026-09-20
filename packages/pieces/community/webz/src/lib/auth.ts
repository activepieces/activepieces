import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const markdownDescription = `
Follow these steps to obtain your Webz.io API Key:

1. Visit [Webz.io](https://webz.io/) and sign up for an account.
2. Navigate to your dashboard / settings.
3. Copy your API token / key.
`;

export const webzAuth = PieceAuth.SecretText({
	description: markdownDescription,
	displayName: 'API Key',
	required: true,
	validate: async ({ auth }) => {
		try {
			await httpClient.sendRequest({
				method: HttpMethod.GET,
				url: 'https://api.webz.io/newsApiLite',
				queryParams: {
					token: auth,
					q: 'test',
					size: '1',
				},
			});
			return {
				valid: true,
			};
		} catch (e) {
			return {
				valid: false,
				error: 'Invalid API Key',
			};
		}
	},
});
