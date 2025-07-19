import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { klaviyoApiCall } from './client';

export const klaviyoAuth = PieceAuth.SecretText({
	displayName: 'Private API Key',
	description: 'Enter your Klaviyo private API key with proper access scopes.',
	required: true,
	validate: async ({ auth }) => {
		try {
			await klaviyoApiCall({
				apiKey: auth as string,
				method: HttpMethod.GET,
				resourceUri: '/accounts',
			});
			return { valid: true };
		} catch (e) {
			return {
				valid: false,
				error: 'Invalid API Key.',
			};
		}
	},
});
