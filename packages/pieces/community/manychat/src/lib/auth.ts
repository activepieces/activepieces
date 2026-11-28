import { PieceAuth } from '@activepieces/pieces-framework';
import { ManychatApiError, manychatClient, manychatUtils } from './common/client';

async function validateApiKey({ apiKey }: { apiKey: string }): Promise<{ valid: true } | { valid: false; error: string }> {
	if (apiKey === '') {
		return { valid: false, error: 'Enter your ManyChat API key.' };
	}
	try {
		await manychatClient.request({ apiKey, method: 'GET', path: '/page/getInfo', operation: 'validate API key' });
		return { valid: true };
	} catch (error) {
		if (error instanceof ManychatApiError) {
			if (error.status === 401) {
				return { valid: false, error: `Invalid API key: ${manychatUtils.vendorMessage(error.responseBody)}` };
			}
			return { valid: false, error: `ManyChat returned HTTP ${error.status} while checking the key: ${manychatUtils.vendorMessage(error.responseBody)}` };
		}
		return { valid: false, error: 'Could not reach ManyChat. Check your network and try again.' };
	}
}

export const manychatAuth = PieceAuth.SecretText({
	displayName: 'API Key',
	required: true,
	description: `The ManyChat API needs a **Pro** plan. To get your API key:
1. Sign in to ManyChat and open the account you want to automate.
2. Go to **Settings -> API** and click **Generate your token**.
3. Copy the token. It looks like \`<page_id>:<hash>\`. Generating a new token revokes the old one.`,
	validate: async ({ auth }) => validateApiKey({ apiKey: manychatUtils.apiKeyOf(auth) }),
});
