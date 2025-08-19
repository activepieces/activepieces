import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { skyvernAuth } from '../common/auth';
import { skyvernApiCall } from '../common/client';

export const cancelRunAction = createAction({
	auth: skyvernAuth,
	name: 'cancel-run',
	displayName: 'Cancel Run',
	description: 'Cancels a workflow or or task run by ID.',
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
			method: HttpMethod.POST,
			resourceUri: `/runs/${runId}/cancel`,
		});

		return response;
	},
});
