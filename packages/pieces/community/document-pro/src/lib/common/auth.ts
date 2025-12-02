import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const documentProAuth = PieceAuth.SecretText({
	displayName: 'API Key',
	description:
		'Get your API key from the Import section in your Workflow tab on [DocumentPro](https://app.documentpro.ai).',
	required: true,
	validate: async ({ auth }) => {
		if (!auth) {
			return {
				valid: false,
				error: 'API key is required',
			};
		}

		try {
			const response = await httpClient.sendRequest({
				method: HttpMethod.GET,
				url: 'https://api.documentpro.ai/files',
				headers: {
					'x-api-key': auth,
					Accept: 'application/json',
				},
				queryParams: {
					limit: '1',
				},
			});

			if (response.status === 200) {
				return {
					valid: true,
				};
			}

			return {
				valid: false,
				error: 'Invalid API key',
			};
		} catch (error: any) {
			const statusCode = error.response?.status || error.status;

			if (statusCode === 401 || statusCode === 403) {
				return {
					valid: false,
					error: 'Invalid API key. Please check your API key and try again.',
				};
			}

			return {
				valid: false,
				error: 'Failed to validate API key. Please check your API key and try again.',
			};
		}
	},
});

