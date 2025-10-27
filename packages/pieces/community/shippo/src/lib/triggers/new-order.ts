import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { ShippoAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const newOrder = createTrigger({
    auth: ShippoAuth,
    name: 'newOrder',
    displayName: 'New Order',
    description: 'Triggers when a new order is created in Shippo.',
    type: TriggerStrategy.WEBHOOK,

    props: {},

    sampleData: {
        event: 'order_created',
        data: {
            object_id: '4f2bc588e4e5446cb3f9fdb7cd5e190b',
            order_number: '1068',
            order_status: 'PAID',
            total_price: '24.93',
            currency: 'USD',
            to_address: {
                name: 'Mr Hippo',
                city: 'San Francisco',
                state: 'CA',
                zip: '94117',
                country: 'US',
            },
        },
    },

    async onEnable(context) {
        const webhookUrl = context.webhookUrl;
        const auth = context.auth as string;

        const body = {
            event: 'order_created',
            url: webhookUrl,
        };

        const response = await makeRequest(auth, HttpMethod.POST, '/webhooks/', body);

        await context.store.put('shippo_order_webhook_id', response.object_id);
    },

    async onDisable(context) {
        const auth = context.auth as string;
        const webhookId = await context.store.get('shippo_order_webhook_id');

        if (webhookId) {
            await makeRequest(auth, HttpMethod.DELETE, `/webhooks/${webhookId}/`);
            await context.store.delete('shippo_order_webhook_id');
        }
    },

    async run(context) {

        const eventData = context.payload?.body;
        return [eventData];
    },
});
