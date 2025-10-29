import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { bigCommerceAuth } from '../..';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const abandonedCart = createTrigger({
    auth: bigCommerceAuth,
    name: 'abandoned_cart',
    displayName: 'Abandoned Cart',
    description: 'Triggers when a cart is abandoned (no changes for at least one hour)',
    props: {},
    sampleData: {
        scope: 'store/cart/abandoned',
        store_id: '1025646',
        data: {
            type: 'cart',
            id: '09346904-4175-44fd-be53-f7e598531b6c'
        },
        hash: '352e4afc6dd3fc85ea26bfdf3f91852604d57528',
        created_at: 1561482670,
        producer: 'stores/abc123xyz'
    },
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
        const storeHash = context.auth.storeHash;
        const accessToken = context.auth.accessToken;

        // Create webhook for abandoned cart
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
                scope: 'store/cart/abandoned',
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