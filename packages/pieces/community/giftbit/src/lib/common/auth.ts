import {
	httpClient,
	HttpMethod,
	AuthenticationType,
} from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { TESTBED_URL, PRODUCTION_URL } from './client';

async function testEndpoint(auth: string, baseUrl: string): Promise<boolean> {
	try {
		await httpClient.sendRequest({
			method: HttpMethod.GET,
			url: `${baseUrl}/ping`,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: auth,
			},
		});
		return true;
	} catch {
		return false;
	}
}

export const giftbitAuth = PieceAuth.SecretText({
	displayName: 'API Token',
	description: 'Get your API token from Account → API keys in your Giftbit dashboard.',
	required: true,
	validate: async ({ auth }) => {
		const isTestbedValid = await testEndpoint(auth, TESTBED_URL);
		if (isTestbedValid) {
			return { valid: true };
		}

		const isProductionValid = await testEndpoint(auth, PRODUCTION_URL);
		if (isProductionValid) {
			return { valid: true };
		}

		return {
			valid: false,
			error: 'Invalid API token',
		};
	},
});
