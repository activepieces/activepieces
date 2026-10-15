import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';

import { emeliaClient } from './common/client';

export const emeliaAuth = PieceAuth.SecretText({
	displayName: 'API Key',
	description: `To get your API key:

1. Log in to [Emelia](https://v3.emelia.io).
2. Open **Settings**, then **API & Webhooks** ([direct link](https://v3.emelia.io/settings/api)).
3. Create a key (or copy an existing one) and paste it here. It is 48 characters long.`,
	required: true,
	validate: async ({ auth }) => {
		try {
			await emeliaClient.request({
				apiKey: auth,
				method: HttpMethod.GET,
				path: '/advanced/campaigns',
			});
			return { valid: true };
		} catch (error) {
			if (emeliaClient.errorStatus({ error }) === 401) {
				return {
					valid: false,
					error: 'Invalid API key. Copy it again from Settings, API & Webhooks in Emelia and make sure all 48 characters are included.',
				};
			}
			return {
				valid: false,
				error: error instanceof Error ? error.message : 'Could not reach Emelia to check the API key.',
			};
		}
	},
});
