import { PieceAuth } from '@activepieces/pieces-framework';
import { makeRequest } from './client';
import { HttpMethod } from '@activepieces/pieces-common';

export const pdfmonkeyAuth = PieceAuth.SecretText({
	displayName: 'API Key',
	description: `You can obtain your API key by navigating to [Account Settings](https://dashboard.pdfmonkey.io/account).`,
	required: true,
	validate: async ({ auth }) => {
		try {
			await makeRequest(auth as string, HttpMethod.GET, '/documents', {});
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
