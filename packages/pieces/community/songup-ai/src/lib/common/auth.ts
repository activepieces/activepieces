import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { songupApiCall } from './client';

export const songupAuth = PieceAuth.SecretText({
	displayName: 'API Key',
	description:
		'Make a key in SongUp AI under Settings → API keys (https://www.songupai.com/settings?tab=developers). It starts with `sup_`.',
	required: true,
	validate: async ({ auth }) => {
		try {
			await songupApiCall({ apiKey: auth, method: HttpMethod.GET, path: '/me' });
			return { valid: true };
		} catch {
			return { valid: false, error: 'Invalid API key.' };
		}
	},
});
