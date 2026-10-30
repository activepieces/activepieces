import { AppConnectionType, PieceAuth } from '@activepieces/pieces-framework';
import { clockifyApi } from './common/api';

export const clockifyAuth = PieceAuth.SecretText({
	displayName: 'API Key',
	description: `You can obtain your API key by navigating to **Preferences->Advanced**.`,
	required: true,
	validate: async ({ auth }) => {
		try {
			await clockifyApi.getCurrentUser({
				auth: { type: AppConnectionType.SECRET_TEXT, secret_text: auth },
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
