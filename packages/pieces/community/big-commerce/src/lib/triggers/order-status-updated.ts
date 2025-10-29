import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { bigCommerceAuth } from '../..';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const orderStatusUpdated = createTrigger({
    auth: bigCommerceAuth,
    name: 'order_status_updated',
    displayName: 'Order Status Updated',
    description: 'Triggers when an order status has changed',
    props: {},
    sampleData: {
        scope: 'store/order/statusUpdated',
        store_id: '1025646',
        data: {
            type: 'order',
            id: 250,
            status: {
                previous_status_id: 0,
                new_status_id: 11
            }
        },
        hash: '0j2i1h8g7f6e5d4c3b2a1f0e9d8c7b6a5e4d3c2b',
        created_at: 1561482670,
        producer: 'stores/abc123xyz'
    },
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
        const storeHash = context.auth.storeHash;
        const accessToken = context.auth.accessToken;

        // Create webhook for order status updated
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
                scope: 'store/order/statusUpdated',
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