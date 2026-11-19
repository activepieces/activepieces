import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { skyvernAuth } from '../common/auth';
import { skyvernApiCall } from '../common/client';

export const getRunAction = createAction({
	auth: skyvernAuth,
	name: 'get-run',
	classification: 'READ',
	displayName: 'Get Run',
	description: 'Gets the status and result of a task or workflow run.',
	audience: 'both',
	aiMetadata: { description: 'Retrieves the current status and details of a Skyvern workflow or task run by its run ID. Use to poll a run started via Run Agent Task or Run Workflow until it completes and to read its results. Read-only and idempotent.', idempotent: true },
	props: {
		runId: Property.ShortText({
			displayName: 'Run ID',
			description: 'The run ID from a Run Agent Task or Run Workflow step.',
			placeholder: 'tsk_v2_486305187432193504',
			required: true,
		}),
	},
	async run(context) {
		const { runId } = context.propsValue;

		const response = await skyvernApiCall({
			apiKey: context.auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: `/runs/${runId}`,
		});

		return response;
	},
});
