import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { airparserApiCall } from './common';

export const airparserAuth = PieceAuth.SecretText({
	displayName: 'API Key',
	required: true,
	description: 'You can find your API key in the Airparser dashboard under Account Settings.',
	validate: async ({ auth }) => {
		try {
			await airparserApiCall({
				apiKey: auth as string,
				method: HttpMethod.GET,
				resourceUri: '/inboxes',
			});

			return {
				valid: true,
			};
		} catch {
			return {
				valid: false,
				error: 'Invalid API key.',
			};
		}
	},
});
