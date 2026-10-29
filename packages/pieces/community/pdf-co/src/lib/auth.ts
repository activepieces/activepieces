import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { pdfCoClient } from './common/client';

export const pdfCoAuth = PieceAuth.SecretText({
	displayName: 'API Key',
	description: `To get your PDF.co API key:
1. Sign in or create an account at [app.pdf.co](https://app.pdf.co/).
2. Open **API** in the left menu.
3. Copy the API key and paste it here.`,
	required: true,
	validate: async ({ auth }) => {
		const apiKey = auth.trim();
		if (apiKey === '') {
			return { valid: false, error: 'Enter your PDF.co API key.' };
		}
		try {
			await pdfCoClient.request({ apiKey, method: HttpMethod.GET, path: '/v1/account/credit/balance' });
			return { valid: true };
		} catch (error) {
			const status = pdfCoClient.statusOf(error);
			if (status === 401 || status === 403) {
				return { valid: false, error: 'PDF.co rejected this API key. Copy it again from app.pdf.co > API.' };
			}
			return { valid: true };
		}
	},
});
