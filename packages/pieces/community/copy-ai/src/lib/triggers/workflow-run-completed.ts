import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { isNil } from '@activepieces/shared';
import { copyAiAuth } from '../../index';


export const workflowRunCompletedTrigger = createTrigger({
    auth:copyAiAuth,
    name: 'workflow_run_completed',
    displayName: 'Workflow Run Completed',
    description: 'Triggered when a workflow run is completed.',
    props: {
        workflowId: Property.ShortText({
			displayName: 'Workflow ID',
			required: true,
		}),
    },
    type: TriggerStrategy.WEBHOOK,
    sampleData: {
        "status": "COMPLETE",
        "input": {
          "should_run": "Test"
        },
        "toolKey": null,
        "metadata": {
          "webapp": true
        },
        "error": null,
        "createdAt": "2025-05-07T09:31:40.545Z",
        "id": "WRUN-7515d814-3890-4ba0-ae32-fa6abcf76432",
        "workflowRunId": "WRUN-7515d814-3890-4ba0-ae32-fa6abcf76432",
        "workflowId": "WCFG-506c46fb-6459-4e23-979b-875444170626",
        "credits": 1,
        "output": {
          "final_output": "",
          "send_api_request": "{}",
        },
        "type": "workflowRun.completed"
      },
    async onEnable(context) {
        const response = await makeRequest(
            context.auth as string,
            HttpMethod.POST,
            '/webhook',
            {
                "url": context.webhookUrl,
                "eventType": "workflowRun.completed",
                "workflowId": context.propsValue.workflowId
              }

        ) as CreateWebhookResponse;

        await context.store.put<{webhookId:string}>('workflow_run_completed',{webhookId:response.data.id})
       
    },
    async onDisable(context) {
        const response = await context.store.get<{webhookId:string}>('workflow_run_completed');
        if(!isNil(response) && !isNil(response.webhookId))
        {
             await makeRequest(
                context.auth as string,
                HttpMethod.DELETE,
                `/webhook/${response.webhookId}`,
                {}
            )

        }
    },
    async run(context) {
        return [context.payload.body];
    },
});


type CreateWebhookResponse = {
    status:string;
    data:{
        id:string
    }
}