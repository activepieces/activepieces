import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { copyAiAuth } from '../../index';

export const runWorkflowAction = createAction({
    auth:copyAiAuth,
	name: 'run_workflow',
	displayName: 'Run Workflow',
	description: 'Start a Copy.ai workflow execution.',
	props: {
		workflowId: Property.ShortText({
			displayName: 'Workflow ID',
			description: 'The ID of the workflow to run.',
			required: true,
		}),
		inputs: Property.Object({
			displayName: 'Workflow Inputs',
			description: 'The input data for the workflow.',
			required: true,
		}),
	},
	async run({ propsValue, auth }) {
		const response = (await makeRequest(
			auth as string,
			HttpMethod.POST,
			`/workflow/${propsValue.workflowId}/run`,
			{
				startVariables: propsValue.inputs,
			},
		)) as CreateRunResponse;

		return {
			runId: response.data.id,
		};
	},
});

type CreateRunResponse = {
	success: string;
	data: {
		id: string;
	};
};
