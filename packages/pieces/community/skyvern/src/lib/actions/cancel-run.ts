import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { skyvernAuth } from '../common/auth';
import { skyvernApiCall } from '../common/client';

export const cancelRunAction = createAction({
	auth: skyvernAuth,
	name: 'cancel-run',
	displayName: 'Cancel Run',
	description: 'Cancels a workflow or or task run by ID.',
	audience: 'both',
	aiMetadata: { description: 'Cancels an in-progress Skyvern workflow or task run identified by its run ID. Use to stop a run an agent previously started (via Run Agent Task or Run Workflow). Idempotent: cancelling an already-cancelled or finished run converges to the same cancelled state with no additional effect.', idempotent: true },
	props: {
		runId: Property.ShortText({
			displayName: 'Workflow/Task Run ID',
			required: true,
		}),
	},
	async run(context) {
		const { runId } = context.propsValue;

		const response = await skyvernApiCall({
			apiKey: context.auth.secret_text,
			method: HttpMethod.POST,
			resourceUri: `/runs/${runId}/cancel`,
		});

		return response;
	},
});
