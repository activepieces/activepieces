import { PieceAuth } from '@activepieces/pieces-framework';
import { beehiivApiCall } from './client';
import { HttpMethod } from '@activepieces/pieces-common';

export const beehiivAuth = PieceAuth.SecretText({
	displayName: 'API Key',
	description: `In beehiiv, go to **Settings > Workspace Settings > API** and create an API key.`,
	required: true,
	validate: async ({ auth }) => {
		try {
			await beehiivApiCall({
				apiKey: auth as string,
				method: HttpMethod.GET,
				resourceUri: '/publications',
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
