import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from './common';

export const filloutFormsAuth = PieceAuth.SecretText({
	displayName: 'API Key',
	required: true,
	description: `To get your API key:
1. Go to your Fillout account settings.
2. Click on "Developer settings".
3. Generate and copy your API key.
4. Paste it here.`,
	validate: async ({ auth }) => {
		try {
			await makeRequest(auth, HttpMethod.GET, '/forms', undefined);
			return { valid: true };
		} catch (error: any) {
			return {
				valid: false,
				error: error.message || 'Invalid API Key. Please check your API key and try again.',
			};
		}
	},
});
