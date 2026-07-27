import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { mistralAuth } from '../common/auth';
import { parseMistralError } from '../common/props';
import { mistralRequest } from '../common/request';

export const listModels = createAction({
  audience: 'both',
	auth: mistralAuth,
	name: 'list_models',
	displayName: 'List Models',
	description: 'Retrieves a list of available Mistral AI models.',
	aiMetadata: { description: 'Returns every model the connected Mistral key can access, chat, embedding and OCR ids alike, exactly as the models endpoint reports them. Use it to discover a valid model id before calling Ask Mistral or Run OCR, both of which require one; it is the only discovery action here and takes no inputs, so it cannot filter or search. Read-only and idempotent.', idempotent: true },
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
