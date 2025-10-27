import { shippoAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import {
    TriggerStrategy,
    createTrigger,
} from '@activepieces/pieces-framework';
import { shippoCommon } from '../common/client';

export const newOrder = createTrigger({
    name: 'new_order',
    displayName: 'New Order',
    description: 'Triggers when a new order is created',
    auth: shippoAuth,
    type: TriggerStrategy.WEBHOOK,
    props: {},
    sampleData: {
        object_id: 'order_123456',
        object_created: '2024-01-15T10:30:00Z',
        object_updated: '2024-01-15T10:30:00Z',
        object_owner: 'user_789',
        order_number: 'ORD-2024-001',
        order_status: 'PAID',
        placed_at: '2024-01-15T10:30:00Z',
        to_address: {
            name: 'Jane Smith',
            company: 'Tech Inc',
            street1: '456 Oak Ave',
            city: 'New York',
            state: 'NY',
            zip: '10001',
            country: 'US',
            phone: '+1-555-123-4567',
            email: 'jane@techinc.com'
        },
        from_address: {
            name: 'John Doe',
            company: 'Acme Corp',
            street1: '123 Main St',
            city: 'San Francisco',
            state: 'CA',
            zip: '94105',
            country: 'US',
            phone: '+1-555-987-6543',
            email: 'john@acmecorp.com'
        },
        line_items: [
            {
                title: 'Product A',
                sku: 'PROD-A-001',
                quantity: 2,
                total_price: '29.99',
                unit_price: '14.99',
                weight: '0.5',
                weight_unit: 'lb'
            }
        ],
        shipping_cost: '8.99',
        shipping_cost_currency: 'USD',
        total_price: '38.98',
        total_price_currency: 'USD',
        notes: 'Handle with care'
    },
    onEnable: async (context) => {
        const { webhookUrl, auth } = context;
        const response = await shippoCommon.apiCall({
            auth,
            method: HttpMethod.POST,
            resourceUri: '/webhooks',
            body: {
                url: webhookUrl,
                events: ['order.created']
            },
        });

        await context.store.put('webhook_id', response.body.object_id);
        return response.body;
    },
    onDisable: async (context) => {
        const { auth } = context;
        const webhookId = await context.store.get('webhook_id');
        if (webhookId) {
            await shippoCommon.apiCall({
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
