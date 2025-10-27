import { uscreenAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import {
    TriggerStrategy,
    createTrigger,
} from '@activepieces/pieces-framework';
import { uscreenCommon } from '../common/client';

export const canceledSubscription = createTrigger({
    name: 'canceled_subscription',
    displayName: 'Canceled Subscription',
    description: 'Triggers when a subscription is canceled for a user',
    auth: uscreenAuth,
    type: TriggerStrategy.WEBHOOK,
    props: {},
    sampleData: {
        id: 'sub_cancel_123456',
        event_type: 'subscription.canceled',
        data: {
            subscription_id: 'sub_456',
            user_id: 'user_123456',
            plan_id: 'plan_789',
            plan_name: 'Premium Monthly',
            canceled_at: '2024-01-15T10:30:00Z',
            cancel_reason: 'user_request',
            effective_cancel_date: '2024-02-15T10:30:00Z'
        }
    },
    onEnable: async (context) => {
        const { webhookUrl, auth } = context;
        const response = await uscreenCommon.apiCall({
            auth,
            method: HttpMethod.POST,
            resourceUri: '/webhooks',
            body: {
                name: 'Activepieces - Canceled Subscription',
                events: ['subscription.canceled'],
                url: webhookUrl,
                active: true
            },
        });

        await context.store.put('webhook_id', response.body.id);
        return response.body;
    },
    onDisable: async (context) => {
        const { auth } = context;
        const webhookId = await context.store.get('webhook_id');
        if (webhookId) {
            await uscreenCommon.apiCall({
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
