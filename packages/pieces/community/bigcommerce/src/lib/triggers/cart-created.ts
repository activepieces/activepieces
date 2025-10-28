
import { createTrigger, TriggerStrategy } from "@activepieces/pieces-framework";
import { bigcommerceAuth, BigCommerceAuth } from "../common/auth";
import { BigCommerceClient } from "../common/client";

interface WebhookPayload {
    scope: string;
    store_id: string;
    data: {
        type: string;
        id: string;
    };
    [key: string]: unknown;
}


const sampleData = {
    "id": "ccd4a8f6-2b99-4da1-a9b2-c21c53abb3bb",
    "customer_id": 2,
    "email": "customer@example.com",
    "currency": { "code": "USD" },
    "tax_included": false,
    "channel_id": 1,
    "line_items": { "physical_items": [ /* ... */ ] },
    "locale": "en",
    "created_time": "2025-10-28T09:56:00Z"
};

export const cartCreated = createTrigger({
    auth: bigcommerceAuth,
    name: 'cart_created',
    displayName: 'Cart Created',
    description: 'Triggers when a new cart is created. (Requires manual webhook setup in BigCommerce: `store/cart/created`).',
    props: {},
    sampleData: sampleData,
    type: TriggerStrategy.WEBHOOK,
    
    async onEnable(context) {
        return;
    },

    async onDisable(context) {
        return;
    },

    async run(context) {
        const payload = context.payload as unknown as WebhookPayload;

        if (payload.scope !== 'store/cart/created' || payload.data.type !== 'cart') {
            return [];
        }

        try {
            const client = new BigCommerceClient(context.auth as BigCommerceAuth);
            const cart = await client.getCart(payload.data.id);

            return [cart];
        } catch (error) {
            console.error(`Error fetching BigCommerce cart ${payload.data.id}`, error);
            return [];
        }
    },

    async test(context) {
        return [sampleData];
    }
});