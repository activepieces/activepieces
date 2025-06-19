import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { copyAiAuth } from '../../index';

export const getWorkflowRunStatusAction = createAction({
    auth:copyAiAuth,
	name: 'get_workflow_run_status',
	displayName: 'Get Workflow Run Status',
	description: 'Retrieves the status of a workflow execution.',
	props: {
		workflowId: Property.ShortText({
			displayName: 'Workflow ID',
			required: true,
		}),
		runId: Property.ShortText({
			displayName: 'Run ID',
			description: 'The ID of the workflow run to check.',
			required: true,
		}),
	},
	async run({ propsValue, auth }) {
		const response = (await makeRequest(
			auth as string,
			HttpMethod.GET,
			`/workflow/${propsValue.workflowId}/run/${propsValue.runId}`,
		)) as GetRunResponse;

		return {
			status: response.data.status,
		};
	},
});

type GetRunResponse = {
	status: string;
	data: {
		status: string;
	};
};
