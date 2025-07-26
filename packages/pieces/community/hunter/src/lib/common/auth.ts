import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { hunterApiCall } from './client';

export const hunterAuth = PieceAuth.SecretText({
	displayName: 'API Key',
	description: `
		Enter your Hunter API key. You can get your API key from the [Hunter Dashboard](https://hunter.io/api-keys).
		
		**How to get your API key:**
		1. Go to the [Hunter Dashboard](https://hunter.io/api-keys)
		2. Sign in to your account
		3. Create a new API key or copy an existing one
		4. Paste the key here
		
		**Note:** You can use **test-api-key** for testing purposes.
	`,
	required: true,
	validate: async ({ auth }) => {
		try {
			const response = await hunterApiCall({
				apiKey: auth as string,
				method: HttpMethod.GET,
				resourceUri: '/account',
			});

			if (response && typeof response === 'object') {
				return { 
					valid: true,
					message: 'API key validated successfully. Connected to Hunter.' 
				};
			}

			return {
				valid: false,
				error: 'Invalid API response format. Please check your API key.',
			};
		} catch (error: any) {
			if (error.message.includes('401') || error.message.includes('Unauthorized')) {
				return {
					valid: false,
					error: 'Invalid API key. Please check your API key and try again.',
				};
			}

			if (error.message.includes('403') || error.message.includes('Forbidden')) {
				return {
					valid: false,
					error: 'API key does not have the required permissions.',
				};
			}

			if (error.message.includes('429')) {
				return {
					valid: false,
					error: 'Rate limit exceeded. Please wait a moment and try again.',
				};
			}

			return {
				valid: false,
				error: `Authentication failed: ${error.message}. Please verify your API key is correct.`,
			};
		}
	},
}); 