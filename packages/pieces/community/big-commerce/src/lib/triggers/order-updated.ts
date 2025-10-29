import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { bigCommerceAuth } from '../..';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const orderUpdated = createTrigger({
    auth: bigCommerceAuth,
    name: 'order_updated',
    displayName: 'Order Updated',
    description: 'Triggers when an order is updated',
    props: {},
    sampleData: {
        scope: 'store/order/updated',
        store_id: '1025646',
        data: {
            type: 'order',
            id: 250
        },
        hash: '9i1h8g7f6e5d4c3b2a1f0e9d8c7b6a5e4d3c2b1a',
        created_at: 1561482670,
        producer: 'stores/abc123xyz'
    },
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
        const storeHash = context.auth.storeHash;
        const accessToken = context.auth.accessToken;

        // Create webhook for order updated
        const response = await httpClient.sendRequest<{
            id: number;
            scope: string;
            destination: string;
            is_active: boolean;
        }>({
            method: HttpMethod.POST,
            url: `https://api.bigcommerce.com/stores/${storeHash}/v3/hooks`,
            headers: {
                'X-Auth-Token': accessToken,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: {
                scope: 'store/order/updated',
                destination: context.webhookUrl,
                is_active: true,
            },
        });

        // Store the webhook ID for later deletion
        await context.store?.put('bigcommerce_webhook_id', response.body.id);
    },
    async onDisable(context) {
        const webhookId = await context.store?.get<number>('bigcommerce_webhook_id');
        
        if (webhookId) {
            const storeHash = context.auth.storeHash;
            const accessToken = context.auth.accessToken;

            // Delete the webhook
            await httpClient.sendRequest({
                method: HttpMethod.DELETE,
                url: `https://api.bigcommerce.com/stores/${storeHash}/v3/hooks/${webhookId}`,
                headers: {
                    'X-Auth-Token': accessToken,
                    'Accept': 'application/json',
                },
            });

            // Clean up stored webhook ID
            await context.store?.put('bigcommerce_webhook_id', null);
        }
    },
    async run(context) {
        return [context.payload.body];
    }
});