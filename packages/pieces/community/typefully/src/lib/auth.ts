import { PieceAuth } from '@activepieces/pieces-framework';
import { typefullyApiCall } from './common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const typefullyAuth = PieceAuth.SecretText({
	displayName: 'API Key',
	description:
		'You can obtain your API key from **Typefully Settings → API**.',
	required: true,
	validate: async ({ auth }) => {
		try {
			await typefullyApiCall({
				apiKey: auth,
				method: HttpMethod.GET,
				resourceUri: '/me',
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
