import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { softrClient } from './client';

export const SoftrAuth = PieceAuth.SecretText({
	displayName: 'API Key',
	description: `Create a personal access token in Softr under **Workspace settings → API tokens** (see [Softr API setup](https://docs.softr.io/softr-api/softr-database-api/authorisation)). The token needs access to the workspace whose databases and apps you want to use.`,
	required: true,
	validate: async ({ auth }) => {
		if (!auth) {
			return { valid: false, error: 'Enter your Softr API key.' };
		}
		try {
			await softrClient.request({ apiKey: auth, method: HttpMethod.GET, path: '/databases' });
			return { valid: true };
		} catch (error) {
			const status = softrClient.getErrorStatus(error);
			if (status === 401 || status === 403) {
				return { valid: false, error: 'Invalid API key. Check the token in your Softr workspace settings.' };
			}
			return {
				valid: false,
				error: `Could not verify the API key with Softr: ${error instanceof Error ? error.message : String(error)}`,
			};
		}
	},
});
