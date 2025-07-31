import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { skyvernAuth } from '../common/auth';
import { skyvernApiCall } from '../common/client';

export const getRunAction = createAction({
	auth: skyvernAuth,
	name: 'get-run',
	displayName: 'Get Workflow/Task Run',
	description: 'Retrieves a workflow or task run by ID.',
	props: {
		runId: Property.ShortText({
			displayName: 'Workflow/Task Run ID',
			required: true,
		}),
	},
	async run(context) {
		const { runId } = context.propsValue;

		const response = await skyvernApiCall({
			apiKey: context.auth,
			method: HttpMethod.GET,
			resourceUri: `/runs/${runId}`,
		});

		return response;
	},
});
