import { PieceAuth } from '@activepieces/pieces-framework';
import { apiKeyOf, BeehiivApiError, beehiivClient, vendorMessage } from './client';

export const beehiivAuth = PieceAuth.SecretText({
	displayName: 'API Key',
	description: `To get your API key:
1. Sign in to beehiiv.
2. Open **Settings** and select **API** under Workspace Settings.
3. Click **Create New API Key**, name it, and copy the key (it is shown only once).`,
	required: true,
	validate: async ({ auth }) => validateApiKey({ apiKey: apiKeyOf(auth) }),
});

async function validateApiKey({ apiKey }: { apiKey: string }): Promise<{ valid: true } | { valid: false; error: string }> {
	if (apiKey === '') {
		return { valid: false, error: 'Enter your beehiiv API key.' };
	}
	try {
		await beehiivClient.request({
			apiKey,
			method: 'GET',
			path: '/publications',
			operation: 'validate API key',
			query: { limit: 1 },
		});
		return { valid: true };
	} catch (error) {
		if (error instanceof BeehiivApiError) {
			if (error.status === 401 || error.status === 403) {
				return { valid: false, error: `Invalid API key: ${vendorMessage(error.responseBody)}` };
			}
			return { valid: false, error: `beehiiv returned HTTP ${error.status} while checking the key: ${vendorMessage(error.responseBody)}` };
		}
		return { valid: false, error: 'Could not reach beehiiv. Check your network and try again.' };
	}
}
