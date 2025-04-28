import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { copyAiClient } from '../common/client';

export const getWorkflowRunOutputs = createAction({
    name: 'get_workflow_run_outputs',
    displayName: 'Get Workflow Run Outputs',
    description: 'Retrieve the outputs of a completed workflow run',
    props: {
        runId: Property.ShortText({
            displayName: 'Run ID',
            description: 'The ID of the workflow run to get outputs from',
            required: true,
        }),
    },
    async run(context: { propsValue: { runId: string }, auth: unknown }) {
        const { runId } = context.propsValue;
        const { auth: apiKey } = context;

        if (!runId || runId.trim().length === 0) {
            throw new Error('Run ID is required');
        }

        if (!apiKey || typeof apiKey !== 'string') {
            throw new Error('Valid API key is required');
        }

        const response = await copyAiClient.makeRequest(
            apiKey,
            HttpMethod.GET,
            `/workflow-runs/${runId}/outputs`
        );

        return response;
    },
});
