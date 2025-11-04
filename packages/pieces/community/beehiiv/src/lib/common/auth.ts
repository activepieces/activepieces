import { PieceAuth } from '@activepieces/pieces-framework';
import { beehiivApiCall } from './client';
import { HttpMethod } from '@activepieces/pieces-common';

export const beehiivAuth = PieceAuth.SecretText({
	displayName: 'API Key',
	description: `Your can obtain API key by naviating to **Settings->Workspace Settings-> API**.`,
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
