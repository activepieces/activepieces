import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { documentProAuth } from '../common/auth';

export const pollExtract = createAction({
	auth: documentProAuth,
	name: 'poll_extract',
	displayName: 'Poll Extract',
	description: 'Retrieve the results of a document extraction using the request ID from a previous extract run.',
	props: {
		requestId: Property.ShortText({
			displayName: 'Request ID',
			description: 'The unique identifier of the extract job (returned when running an extract)',
			required: true,
		}),
	},
	async run(context) {
		const { requestId } = context.propsValue;

		const response = await httpClient.sendRequest({
			method: HttpMethod.GET,
			url: 'https://api.documentpro.ai/files',
			headers: {
				'x-api-key': context.auth,
				Accept: 'application/json',
			},
			queryParams: {
				request_id: requestId,
			},
		});

		return response.body;
	},
});

