import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { clockifyApiCall } from './common/client';

export const clockifyAuth = PieceAuth.SecretText({
	displayName:'API Key',
	description: `You can obtain your API key by navigating to **Preferences->Advanced**.`,
	required: true,
	validate: async ({ auth }) => {
		try {
			await clockifyApiCall({
				apiKey: auth,
				method: HttpMethod.GET,
				resourceUri: '/user',
			});

			return {
				valid: true,
			};
		} catch {
			return {
				valid: false,
				error: 'Invalid API Key.',
			};
		}
	},
});
