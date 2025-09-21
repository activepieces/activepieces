
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { CapsuleCRMAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
export const newOpportunities = createTrigger({
    auth: CapsuleCRMAuth,
    name: 'newOpportunities',
    displayName: 'New Opportunities',
    description: '',
    props: {},
    sampleData: {
        event: 'opportunity-created',
        opportunity: {
            id: 205,
            name: 'New Website Redesign Project',
            milestone: {
                id: 1,
                name: 'Lead',
            },
            party: {
                id: 101,
                type: 'organisation',
                name: 'Global Corp Inc.',
            },
            value: {
                currency: 'USD',
                amount: 7500,
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
        return [context.payload.body]
    }
})