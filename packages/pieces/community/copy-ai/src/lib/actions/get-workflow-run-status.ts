import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { copyAiClient } from '../common/client';

export const getWorkflowRunStatus = createAction({
    name: 'get_workflow_run_status',
    displayName: 'Get Workflow Run Status',
    description: 'Check the status of a workflow execution',
    props: {
        runId: Property.ShortText({
            displayName: 'Run ID',
            description: 'The ID of the workflow run to check',
            required: true,
        }),
    },
    async run(context) {
        return await copyAiClient.makeRequest(
            context.auth as string,
            HttpMethod.GET,
            `/workflow-runs/${context.propsValue.runId}/status`
        );
    },
});
