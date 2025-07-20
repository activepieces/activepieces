import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { copyAiAuth } from '../../index';

export const getWorkflowRunOutputsAction = createAction({
    auth:copyAiAuth,
	name: 'get_workflow_run_outputs',
	displayName: 'Get Workflow Run Outputs',
	description: 'Retrieves the outputs of a completed workflow run.',
	props: {
		workflowId: Property.ShortText({
			displayName: 'Workflow ID',
			required: true,
		}),
		runId: Property.ShortText({
			displayName: 'Run ID',
			description: 'The ID of the workflow run to get outputs from.',
			required: true,
		}),
	},
	async run({ propsValue, auth }) {
		const response = await makeRequest(
			auth as string,
			HttpMethod.GET,
			`/workflow/${propsValue.workflowId}/run/${propsValue.runId}`,
		);

		return response.data?.output || response;
	},
});
