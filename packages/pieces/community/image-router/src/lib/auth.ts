import { AppConnectionType, PieceAuth } from '@activepieces/pieces-framework';

import { imageRouterApi } from './common/api';

export const imageRouterAuth = PieceAuth.SecretText({
	displayName: 'API Key',
	description:
		'Your ImageRouter API key. You can get your API key from the [ImageRouter API Keys page](https://imagerouter.io/api-keys).',
	required: true,
	validate: async ({ auth }) => {
		try {
			await imageRouterApi.generateImage({
				auth: { type: AppConnectionType.SECRET_TEXT, secret_text: auth },
				prompt: 'test',
				model: 'test/test',
			});

			return {
				valid: true,
				message: 'API key validated successfully. Connected to ImageRouter.',
			};
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);

			if (message.includes('401') || message.includes('403')) {
				return {
					valid: false,
					error: 'Invalid API key. Please check your API key and try again.',
				};
			}

			if (message.includes('429')) {
				return {
					valid: false,
					error: 'Rate limit exceeded. Please wait a moment and try again.',
				};
			}

			return {
				valid: false,
				error: `Authentication failed: ${message}. Please verify your API key is correct.`,
			};
		}
	},
});
