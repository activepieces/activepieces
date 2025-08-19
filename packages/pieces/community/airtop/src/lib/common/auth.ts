import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { airtopApiCall } from './client';

export const airtopAuth = PieceAuth.SecretText({
	displayName: 'API Key',
	description: `
		Enter your Airtop API key. You can get your API key from the [Airtop Dashboard](https://portal.airtop.ai/api-keys).
		
		**How to get your API key:**
		1. Go to the [Airtop Dashboard](https://portal.airtop.ai/api-keys)
		2. Sign in to your account
		3. Navigate to API Keys section
		4. Create a new API key or copy an existing one
		5. Paste the key here
	`,
	required: true,
	validate: async ({ auth }) => {
		try {
			const response = await airtopApiCall({
				apiKey: auth as string,
				method: HttpMethod.GET,
				resourceUri: '/sessions',
			});

			if (response && typeof response === 'object') {
				return { 
					valid: true,
					message: 'API key validated successfully. Connected to Airtop.' 
				};
			}

			return {
				valid: false,
				error: 'Invalid API response format. Please check your API key.',
			};
		} catch (error: any) {
			if (error.message.includes('Authentication failed')) {
				return {
					valid: false,
					error: 'Invalid API key. Please check your API key and try again.',
				};
			}

			if (error.message.includes('Network')) {
				return {
					valid: false,
					error: 'Network error. Please check your internet connection and try again.',
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
				error: `Authentication failed: ${error.message}. Please verify your API key is correct and has the necessary permissions.`,
			};
		}
	},
});
