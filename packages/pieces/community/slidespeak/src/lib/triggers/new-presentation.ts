import { createTrigger, TriggerStrategy } from "@activepieces/pieces-framework";
import { makeRequest } from "../common/client";
import { slidespeakAuth } from "../common/auth";
import { HttpMethod } from "@activepieces/pieces-common";

export const newPresentation = createTrigger({
    auth: slidespeakAuth,
    name: 'new_presentation',
    displayName: 'New Presentation',
    description: 'Fires when a new SlideSpeak presentation is created.',
    props: {},
    sampleData: {
        task_id: "353509d6-8efe-401c-a8a9-53ca64b520a3",
        task_status: "SUCCESS",
        task_result: {
            "url": "https://slidespeak-files.s3.us-east-2.amazonaws.com/sample-file.pptx"
        },
        task_info: {
            "url": "https://slidespeak-files.s3.us-east-2.amazonaws.com/sample-file.pptx"
        }
    },
    type: TriggerStrategy.WEBHOOK,


    async onEnable(context) {
        const response = await makeRequest<{ webhook_id: string }>(
            context.auth,
            HttpMethod.POST,
            '/webhook/subscribe',
            {
                endpoint: context.webhookUrl,
            }
        );

        await context.store.put('webhook_id', response.webhook_id);
    },

   
    async onDisable(context) {
        const webhookId = await context.store.get('webhook_id');
        if (webhookId) {

            await makeRequest(
                context.auth,
                HttpMethod.POST,
                '/webhook/unsubscribe', 
                {
                    webhook_id: webhookId,
                }
            );
        }
    },


    async run(context) {
        return [context.payload.body];
    },
});