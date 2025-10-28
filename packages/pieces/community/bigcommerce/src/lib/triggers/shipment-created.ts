

import { createTrigger, TriggerStrategy } from "@activepieces/pieces-framework";
import { bigcommerceAuth, BigCommerceAuth } from "../common/auth";
import { BigCommerceClient } from "../common/client";


interface WebhookPayload {
    scope: string; 
    store_id: string;
    data: {
        type: string;   
        id: number;      
        orderId?: number; 
        order?: {        
            id: number;
        }
    };
    hash: string;
    created_at: number; 
    producer: string;
}

const sampleData = {
    "id": 46,
    "order_id": 120,
    "customer_id": 1, 
    "order_address_id": 128,
    "date_created": "2025-10-28T10:38:00Z",
    "tracking_number": "EJ958083578UK",
    "shipping_provider": "FedEx",
    "tracking_link": "https://www.fedex.com/...", 
    "comments": "Shipment for Jane's Order",
    "items": [
        { "order_product_id": 194, "product_id": 50, "quantity": 1 }, 
        { "order_product_id": 195, "product_id": 51, "quantity": 2 }
    ]
};

export const shipmentCreated = createTrigger({
    auth: bigcommerceAuth,
    name: 'shipment_created',
    displayName: 'Shipment Created',
    description: 'Triggers when a new shipment is created. (Requires manual webhook setup in BigCommerce: `store/shipment/created`).',
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

        if (payload.scope !== 'store/shipment/created') {
             console.log(`Webhook received for scope ${payload.scope}, ignoring.`);
            return [];
        }

        const shipmentId = payload.data?.id;
        const orderId = payload.data?.orderId ?? payload.data?.order?.id; 

        if (!shipmentId || !orderId) {
            console.error("Webhook payload missing shipment or order ID:", payload);
            return [];
        }

        try {
            const client = new BigCommerceClient(context.auth as BigCommerceAuth);
            const shipment = await client.getShipmentById(orderId, shipmentId);

            return [shipment];
        } catch (error) {
            console.error(`Error fetching BigCommerce shipment ${shipmentId} for order ${orderId}`, error);
            return [];
        }
    },

    async test(context) {
        return [sampleData];
    }
});