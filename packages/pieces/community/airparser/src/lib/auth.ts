import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { AirparserApiError, airparserClient, vendorMessage } from './common';

export const airparserAuth = PieceAuth.SecretText({
	displayName: 'API Key',
	required: true,
	description: 'Find your API key in the Airparser dashboard under Account Settings.',
	validate: async ({ auth }) => {
		try {
			await airparserClient.call({
				apiKey: typeof auth === 'string' ? auth : '',
				method: HttpMethod.GET,
				path: '/inboxes',
				operation: 'key check',
			});
			return { valid: true };
		} catch (error) {
			return { valid: false, error: validationMessage(error) };
		}
	},
});

function validationMessage(error: unknown): string {
	if (error instanceof AirparserApiError) {
		const detail = vendorMessage(error.responseBody);
		if (error.status === 401 || error.status === 403) {
			return `Airparser rejected the API key (HTTP ${error.status}): ${detail}. Copy the key again from Account Settings.`;
		}
		return `Airparser could not verify the API key (HTTP ${error.status}): ${detail}.`;
	}
	return error instanceof Error ? error.message : 'Airparser could not verify the API key.';
}
