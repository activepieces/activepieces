import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { mistralAuth } from '../common/auth';
import { parseMistralError } from '../common/props';
import { mistralRequest } from '../common/request';

export const listModels = createAction({
	auth: mistralAuth,
	name: 'list_models',
	displayName: 'List Models',
	description: 'Retrieves a list of available Mistral AI models.',
	props: {},
	async run({ auth }) {
		try {
			const { baseUrl, headers } = mistralRequest.getConfig(auth);
			const response = await httpClient.sendRequest({
				method: HttpMethod.GET,
				url: `${baseUrl}/models`,
				headers,
			});

			return response.body;
		} catch (e: any) {
			throw new Error(parseMistralError(e));
		}
	},
});
