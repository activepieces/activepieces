import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { placidApiCall } from './client';

export const placidAuth = PieceAuth.SecretText({
	displayName: 'API Token',
	description: `You can obtain your API token by logging in at [placid.app/login](https://placid.app/login), going to your project, and clicking "API Tokens" in the sidebar.`,
	required: true,
	validate: async ({ auth }) => {
		try {
			await placidApiCall({
				apiKey: auth as string,
				method: HttpMethod.GET,
				resourceUri: '/templates',
			});
			return { valid: true };
		} catch (error) {
			return {
				valid: false,
				error: 'Invalid API Token.',
			};
		}
	},
});
