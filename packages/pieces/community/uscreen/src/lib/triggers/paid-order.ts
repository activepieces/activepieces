import { uscreenAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import {
    TriggerStrategy,
    createTrigger,
} from '@activepieces/pieces-framework';
import { uscreenCommon } from '../common/client';

export const paidOrder = createTrigger({
    name: 'paid_order',
    displayName: 'Paid Order',
    description: 'Triggers when a payment is processed for subscriptions, bundles, or content',
    auth: uscreenAuth,
    type: TriggerStrategy.WEBHOOK,
    props: {},
    sampleData: {
        id: 'order_123456',
        event_type: 'order.paid',
        data: {
            order_id: 'order_123456',
            customer_id: 'customer_789',
            amount: 29.99,
            currency: 'USD',
            payment_method: 'credit_card',
            subscription_id: 'sub_456',
            bundle_id: 'bundle_789',
            content_id: 'content_101',
            created_at: '2024-01-15T10:30:00Z',
            updated_at: '2024-01-15T10:30:00Z'
        }
    },
    onEnable: async (context) => {
        const { webhookUrl, auth } = context;
        const response = await uscreenCommon.apiCall({
            auth,
            method: HttpMethod.POST,
            resourceUri: '/webhooks',
            body: {
                name: 'Activepieces - Paid Order',
                events: ['order.paid'],
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
