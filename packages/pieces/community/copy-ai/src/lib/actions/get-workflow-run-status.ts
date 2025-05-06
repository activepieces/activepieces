import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';

export const getWorkflowRunStatus = createAction({
    name: 'get_workflow_run_status',
    displayName: 'Get Workflow Run Status',
    description: 'Check the status of a workflow execution',
    props: {
        workflowId: Property.ShortText({
            displayName: 'Workflow ID',
            description: 'The ID of the workflow to check',
            required: true,
        }),
        runId: Property.ShortText({
            displayName: 'Run ID',
            description: 'The ID of the workflow run to check',
            required: true,
        }),
    },
    async run({ propsValue, auth }) {
        return await makeRequest(
            auth as string,
            HttpMethod.GET,
            `/workflow/${propsValue.workflowId}/run/${propsValue.runId}`
        );
    },
});
