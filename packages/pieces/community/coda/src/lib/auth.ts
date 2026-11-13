import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { codaApi } from './common/client';

export const codaAuth = PieceAuth.SecretText({
	displayName: 'Coda API Key',
	description: `Create an API token in Coda (now Superhuman Docs): open [Account settings](https://coda.io/account), scroll to **API settings**, click **Generate API token**, and paste it here.`,
	required: true,
	validate: async ({ auth }) => {
		try {
			await codaApi.request({
				token: auth,
				method: HttpMethod.GET,
				path: '/whoami',
				operation: 'check API token',
			});
			return { valid: true };
		} catch (error) {
			const status = codaApi.statusOf(error);
			if (status === 401 || status === 403) {
				return { valid: false, error: 'Invalid API token. Generate a new token in Coda account settings and try again.' };
			}
			return { valid: false, error: error instanceof Error ? error.message : 'Could not reach Coda to check the API token.' };
		}
	},
});
