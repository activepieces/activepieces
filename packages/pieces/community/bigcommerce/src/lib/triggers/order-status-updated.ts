
import { createTrigger, TriggerStrategy } from "@activepieces/pieces-framework";
import { bigcommerceAuth, BigCommerceAuth } from "../common/auth";
import { BigCommerceClient } from "../common/client";


interface WebhookPayload {
    scope: string;
    store_id: string;
    data: {
        type: string;
        id: number;   
        status: {
            previous_status_id: number;
            new_status_id: number;
        }
    };
    hash: string;
    created_at: number; 
    producer: string;
}

const sampleData = {
    "id": 250,
    "customer_id": 1,
    "date_created": "2025-10-28T12:01:33Z",
    "date_modified": "2025-10-28T13:15:00Z",
    "status_id": 11, 
    "status": "Awaiting Fulfillment", 
    "total_inc_tax": "110.00",
    "billing_address": { /* ... */ },
    "_webhook_status_info": { 
        "previous_status_id": 0,
        "new_status_id": 11
    }
};

export const orderStatusUpdated = createTrigger({
    auth: bigcommerceAuth,
    name: 'order_status_updated',
    displayName: 'Order Status Updated',
    description: 'Triggers when an order status has changed. (Requires manual webhook setup in BigCommerce: `store/order/statusUpdated`).',
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

        if (payload.scope !== 'store/order/statusUpdated' || payload.data?.type !== 'order') {
            console.log(`Webhook received for scope ${payload.scope} / type ${payload.data?.type}, ignoring.`);
            return [];
        }

        const orderId = payload.data?.id;
        const statusInfo = payload.data?.status;

        if (!orderId || !statusInfo) {
            console.error("Webhook payload missing order ID or status info:", payload);
            return [];
        }

        try {
            const client = new BigCommerceClient(context.auth as BigCommerceAuth);
            const order = await client.getOrderById(orderId);

            const result = {
                ...order,
                _webhook_status_info: {
                    previous_status_id: statusInfo.previous_status_id,
                    new_status_id: statusInfo.new_status_id
                }
            };
            return [result];
        } catch (error) {
            console.error(`Error fetching updated BigCommerce order ${orderId}`, error);
            return [];
        }
    },

    async test(context) {
        return [sampleData];
    }
});