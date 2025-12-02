import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { documentProAuth } from '../common/auth';

export const deleteJob = createAction({
	auth: documentProAuth,
	name: 'delete_job',
	displayName: 'Delete Job',
	description: 'Delete a parsing job from DocumentPro. This action cannot be undone.',
	props: {
		requestId: Property.ShortText({
			displayName: 'Request ID',
			description: 'The unique identifier of the parsing job to delete',
			required: true,
		}),
	},
	async run(context) {
		const { requestId } = context.propsValue;

		const response = await httpClient.sendRequest({
			method: HttpMethod.DELETE,
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

