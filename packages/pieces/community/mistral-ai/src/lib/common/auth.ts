import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';

export const mistralAuth = PieceAuth.SecretText({
	displayName: 'API Key',
	description: `You can obtain your API key from the Mistral AI dashboard. Go to https://console.mistral.ai, generate an API key, and paste it here.`,
	required: true,
	validate: async ({ auth }) => {
		try {
			await httpClient.sendRequest({
				method: HttpMethod.GET,
				url: 'https://api.mistral.ai/v1/models',
				authentication: {
					type: AuthenticationType.BEARER_TOKEN,
					token: auth as string,
				},
			});
			return { valid: true };
		} catch (e: any) {
			if (e.response?.status === 401) {
				return { valid: false, error: 'Invalid API key. Please check your API key and try again.' };
			}
			if (e.response?.status === 429) {
				return { valid: false, error: 'Rate limit exceeded. Please wait and try again.' };
			}
			if (e.message?.toLowerCase().includes('network')) {
				return { valid: false, error: 'Network error. Please check your internet connection.' };
			}
			return { valid: false, error: 'Authentication failed: ' + (e.message || 'Unknown error') };
		}
	},
});
