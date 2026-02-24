import {
	httpClient,
	HttpMethod,
	AuthenticationType,
} from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { BASE_URL } from './client';

async function testEndpoint(auth: string): Promise<boolean> {
	try {
		await httpClient.sendRequest({
			method: HttpMethod.GET,
			url: `${BASE_URL}api/user/info`,
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

export const seekTableAuth = PieceAuth.SecretText({
	displayName: 'API Key',
	description: 'Get your API key from Manage Account → Get API Key dialog in your SeekTable dashboard.',
	required: true,
	validate: async ({ auth }) => {
		const isValid = await testEndpoint(auth);
		if (isValid) {
			return { valid: true };
		}

		return {
			valid: false,
			error: 'Invalid API key',
		};
	},
});
