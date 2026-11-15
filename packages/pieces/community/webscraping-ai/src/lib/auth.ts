import { AppConnectionType, PieceAuth, tryCatch } from '@activepieces/pieces-framework';

import { webscrapingAiApi } from './common/api';

export const webscrapingAiAuth = PieceAuth.SecretText({
	displayName: 'API Key',
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
