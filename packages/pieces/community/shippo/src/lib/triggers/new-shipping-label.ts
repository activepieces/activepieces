import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { ShippoAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const newShippingLabel = createTrigger({
    auth: ShippoAuth,
    name: 'newShippingLabel',
    displayName: 'New Shipping Label',
    description: 'Triggers when a new shipping label (transaction) is created in Shippo.',
    type: TriggerStrategy.WEBHOOK,

    props: {},

    sampleData: {
        event: 'transaction_created',
        data: {
            object_id: 'd799c2679e644279b59fe661ac8fa488',
            status: 'SUCCESS',
            label_url: 'https://api.goshippo.com/labels/yourlabel.pdf',
            tracking_number: 'SHIPPO123456',
        },
    },

    async onEnable(context) {
        const webhookUrl = context.webhookUrl;
        const auth = context.auth as string;

        const body = {
            event: 'transaction_created',
            url: webhookUrl,
        };

        const response = await makeRequest(auth, HttpMethod.POST, '/webhooks/', body);

        await context.store.put('shippo_webhook_id', response.object_id);
    },

    async onDisable(context) {
        const auth = context.auth as string;
        const webhookId = await context.store.get('shippo_webhook_id');

        if (webhookId) {
            await makeRequest(auth, HttpMethod.DELETE, `/webhooks/${webhookId}/`);
            await context.store.delete('shippo_webhook_id');
        }
    },

    async run(context) {

        const eventData = context.payload?.body;

        return [eventData];
    },
});
