import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { copyAiClient } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const workflowRunCompleted = createTrigger({
    name: 'workflow_run_completed',
    displayName: 'Workflow Run Completed',
    description: 'Triggered when a workflow run is completed',
    props: {
        workflowId: Property.ShortText({
            displayName: 'Workflow ID',
            description: 'The ID of the workflow to monitor',
            required: true,
        }),
    },
    type: TriggerStrategy.WEBHOOK,
    sampleData: {
        "id": "wf_123",
        "status": "completed",
        "outputs": {
            "text": "Sample generated text"
        }
    },
    async onEnable(context) {
        const response = await copyAiClient.makeRequest(
            context.auth as string,
            HttpMethod.POST,
            '/webhooks',
            {
                workflowId: context.propsValue.workflowId,
                url: context.webhookUrl,
                event: 'workflow.run.completed'
            }
        );
        await context.store.put('webhookId', response.id);
    },
    async onDisable(context) {
        const webhookId = await context.store.get('webhookId');
        if (webhookId) {
            await copyAiClient.makeRequest(
                context.auth as string,
                HttpMethod.DELETE,
                `/webhooks/${webhookId}`
            );
        }
    },
    async run(context) {
        return [context.payload];
    },
});
