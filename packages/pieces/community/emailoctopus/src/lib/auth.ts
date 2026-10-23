import { AppConnectionType, PieceAuth } from '@activepieces/pieces-framework';

import { emailOctopusApi } from './common/api';

export const emailOctopusAuth = PieceAuth.SecretText({
	displayName: 'API Key',
	description: `
    To get your API key:
    1. Log in to your EmailOctopus account.
    2. Go to your **account settings**.
    3. Generate a new API key.
    **Note:** If you have a 'legacy' key, you must generate a new one for API v2.
    `,
	required: true,
	validate: async ({ auth }) => {
		try {
			await emailOctopusApi.listLists({
				auth: { type: AppConnectionType.SECRET_TEXT, secret_text: auth },
			});
			return { valid: true };
		} catch {
			return { valid: false, error: 'Invalid API key.' };
		}
	},
});
