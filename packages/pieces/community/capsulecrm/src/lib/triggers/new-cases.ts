import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { CapsuleCRMAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const newCases = createTrigger({
    auth: CapsuleCRMAuth,
    name: 'newCases',
    displayName: 'New Cases',
    description: 'Triggers when a new case is created in Capsule CRM',
    props: {},
    sampleData: {
        event: 'kase-created',
        kase: {
            id: 301,
            name: 'Q1 Marketing Campaign',
            description: 'Launch campaign for the new product line.',
            party: {
                id: 101,
                type: 'organisation',
                name: 'Global Corp Inc.',
            },
        },
    },
    type: TriggerStrategy.WEBHOOK,

    async onEnable(context) {
        const webhookUrl = context.webhookUrl;
        const body = {
            restHook: {
                event: 'case/created',
                targetUrl: webhookUrl,
                description: 'Triggered when a new case is created in Capsule CRM'
            }
        };

        const response = await makeRequest(
            context.auth as string,
            HttpMethod.POST,
            '/resthooks',
            body
        );

        await context.store?.put('restHookId', response.restHook.id);
    },

    async onDisable(context) {
        const restHookId = await context.store?.get('restHookId');
        if (restHookId) {
            await makeRequest(
                context.auth as string,
                HttpMethod.DELETE,
                `/resthooks/${restHookId}`
            );
        }
    },

    async run(context) {
        return [context.payload.body];
    }
});
