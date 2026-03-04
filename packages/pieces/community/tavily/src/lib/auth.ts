import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const markdownDescription = `
Follow these steps to obtain your Tavily API Key:

1. Visit [tavily](https://tavily.com/) and create an account.
2. Log in and navigate to your dashboard.
3. Locate and copy your API key from the dashboard.
`;

export const tavilyAuth = PieceAuth.SecretText({
	description: markdownDescription,
	displayName: 'API Key',
	required: true,
	validate: async ({ auth }) => {
		try {
			await httpClient.sendRequest({
				method: HttpMethod.POST,
				url: 'https://api.tavily.com/search',
				headers: {
					'Content-Type': 'application/json',
				},
				body: {
					api_key: auth,
					query: 'test',
					search_depth: 'basic',
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
