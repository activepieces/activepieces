import { AppConnectionType, PieceAuth, tryCatch } from '@activepieces/pieces-framework';

import { webscrapingAiApi } from './common/api';

export const webscrapingAiAuth = PieceAuth.SecretText({
	displayName: 'API Key',
	description: [
		'To get your API key:',
		'1. Sign in at https://webscraping.ai',
		'2. Open your Dashboard',
		'3. Copy the API key and paste it here',
	].join('\n'),
	required: true,
	validate: async ({ auth }) => {
		const { error } = await tryCatch(() =>
			webscrapingAiApi.getAccount({
				auth: { type: AppConnectionType.SECRET_TEXT, secret_text: auth },
			}),
		);
		return error ? { valid: false, error: 'Invalid API Key' } : { valid: true };
	},
});
