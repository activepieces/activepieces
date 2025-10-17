import { productboardAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import {
    TriggerStrategy,
    createTrigger,
} from '@activepieces/pieces-framework';
import { productboardCommon } from '../common/client';

export const updatedFeature = createTrigger({
    name: 'updated_feature',
    displayName: 'Updated Feature',
    description: 'Triggers when an existing feature is updated in Productboard',
    auth: productboardAuth,
    type: TriggerStrategy.WEBHOOK,
    props: {},
    sampleData: {
        data: {
            id: 'c5a0b5f0-3f2e-4e1a-8c7z-5c8e4b3f2e1a',
            eventType: 'feature.updated',
            links: {
                target: 'https://api.productboard.com/features/c5a0b5f0-3f2e-4e1a-8c7z-5c8e4b3f2e1a',
            },
        },
    },
    onEnable: async (context) => {
        const { webhookUrl, auth } = context;
        const response = await productboardCommon.apiCall({
            auth,
            method: HttpMethod.POST,
            resourceUri: '/webhooks',
            body: {
                data: {
                    name: 'Activepieces - Updated Feature',
                    events: [
                        {
                            eventType: 'feature.updated',
                        },
                    ],
                    notification: {
                        url: webhookUrl,
                        version: 1,
                    },
                },
            },
        });

        await context.store.put('webhook_id', response.body['data'].id);
        return response.body;
    },
    onDisable: async (context) => {
        const { auth } = context;
        const webhookId = await context.store.get('webhook_id');
        if (webhookId) {
            await productboardCommon.apiCall({
                auth,
                method: HttpMethod.DELETE,
                resourceUri: `/webhooks/${webhookId}`,
            });
        }
    },
    run: async (context) => {
        return [context.payload.body];
    },
});
