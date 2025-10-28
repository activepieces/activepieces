
import { createTrigger, TriggerStrategy } from "@activepieces/pieces-framework";
import { bigcommerceAuth, BigCommerceAuth } from "../common/auth";
import { BigCommerceClient } from "../common/client";


interface WebhookPayload {
    scope: string; 
    store_id: string;
    data: {
        type: string;
        id: number;   
    };
    hash: string;
    created_at: number; 
    producer: string;
}

const sampleData = {
    "id": 102,
    "customer_id": 1,
    "date_created": "2025-10-28T12:01:33Z",
    "status_id": 1,
    "status": "Pending",
    "subtotal_inc_tax": "100.00",
    "total_inc_tax": "110.00",
    "billing_address": {
        "first_name": "Jane",
        "last_name": "Doe",
        "city": "Austin",
        "state": "Texas",
    },

};

export const orderCreated = createTrigger({
    auth: bigcommerceAuth,
    name: 'order_created',
    displayName: 'Order Created',
    description: 'Triggers when a new order is created. (Requires manual webhook setup in BigCommerce: `store/order/created`).',
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


        if (payload.scope !== 'store/order/created' || payload.data?.type !== 'order') {
            console.log(`Webhook received for scope ${payload.scope} / type ${payload.data?.type}, ignoring.`);
            return [];
        }

        const orderId = payload.data?.id;
        if (!orderId) {
            console.error("Webhook payload missing order ID:", payload);
            return [];
        }

        try {
            const client = new BigCommerceClient(context.auth as BigCommerceAuth);
            const order = await client.getOrderById(orderId);

            return [order];
        } catch (error) {
            console.error(`Error fetching BigCommerce order ${orderId}`, error);
            return [];
        }
    },

    async test(context) {
        return [sampleData];
    }
});