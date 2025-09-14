import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { SlideSpeakAuth } from '../common/auth';

export const newPresentation = createTrigger({
    auth: SlideSpeakAuth,
    name: 'new_presentation',
    displayName: 'New Presentation',
    description: 'Fires when a new SlideSpeak presentation is generated (via webhook subscription).',
    type: TriggerStrategy.WEBHOOK,
    props: {
    },
    async onEnable(context) {
        const { webhookUrl } = context;
        await makeRequest(
            context.auth as string,
            HttpMethod.POST,
            '/webhook/subscribe',
            {
                endpoint: webhookUrl,
            }
        );
    },
    async onDisable(context) {
        const stored = await context.store?.get('slidespeak_webhook_id');
        if (stored) {
            await makeRequest(
                context.auth as string,
                HttpMethod.DELETE,
                '/webhook/unsubscribe',
                {
                    webhook_id: stored,
                }
            );
            await context.store?.delete('slidespeak_webhook_id');
        }
    },
    async run(context) {
        return [context.payload.body];
    },
    sampleData: {
        task_id: '353509d6-8efe-401c-a8a9-53ca64b520a3',
        task_status: 'SUCCESS',
        task_result: {
            url: 'https://slidespeak-files.s3.us-east-2.amazonaws.com/24d89111-71a1-4c05-a909-2d84123c9ba9.pptx'
        },
        task_info: {
            url: "https://slidespeak-files.s3.us-east-2.amazonaws.com/24d89111-71a1-4c05-a909-2d84123c9ba9.pptx"
        }
    }
});
