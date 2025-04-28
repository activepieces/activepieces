import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { copyAiClient } from '../common/client';

export const runWorkflow = createAction({
    name: 'run_workflow',
    displayName: 'Run Workflow',
    description: 'Start a Copy.ai workflow execution',
    props: {
        workflowId: Property.ShortText({
            displayName: 'Workflow ID',
            description: 'The ID of the workflow to run',
            required: true,
        }),
        inputs: Property.Object({
            displayName: 'Workflow Inputs',
            description: 'The input data for the workflow',
            required: true,
        }),
    },
    async run(context) {
        return await copyAiClient.makeRequest(
            context.auth as string,
            HttpMethod.POST,
            `/workflows/${context.propsValue.workflowId}/run`,
            {
                inputs: context.propsValue.inputs
            }
        );
    },
});
