

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
    "customer_id": 0, 
    "date_created": "Fri, 30 Sep 2022 08:23:54 +0000",
    "date_modified": "Fri, 30 Sep 2022 08:38:44 +0000", 
    "status_id": 1, 
    "status": "Pending",
    "subtotal_ex_tax": "50.0000",
    "total_inc_tax": "40.0000", 
    "billing_address": {
        "first_name": "Chau",
        "last_name": "Hoang",
        "street_1": "123 Main Street",
    },
};

export const orderUpdated = createTrigger({
    auth: bigcommerceAuth,
    name: 'order_updated',
    displayName: 'Order Updated',
    description: 'Triggers when an order is updated. (Requires manual webhook setup in BigCommerce: `store/order/updated`).',
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

        if (payload.scope !== 'store/order/updated' || payload.data?.type !== 'order') {
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
            console.error(`Error fetching updated BigCommerce order ${orderId}`, error);
            return [];
        }
    },

    async test(context) {
        return [sampleData];
    }
});