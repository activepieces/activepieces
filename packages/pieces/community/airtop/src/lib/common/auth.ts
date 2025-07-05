import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { airtopApiCall } from './client';

export const airtopAuth = PieceAuth.SecretText({
	displayName: 'API Key',
	description: `You can get your API key from [Airtop Dashboard](https://portal.airtop.ai/api-keys).`,
	required: true,
	validate: async ({ auth }) => {
		try {
			await airtopApiCall({
				apiKey: auth as string,
				method: HttpMethod.GET,
				resourceUri: '/sessions',
			});
			return { valid: true };
		} catch {
			return {
				valid: false,
				error: 'Invalid API Key.',
			};
		}
	},
});
