
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
    "id": 1,
    "company": "Newcorp Inc.",
    "first_name": "Jane",
    "last_name": "Doe",
    "email": "john.smith@example.com", 
    "phone": "987-654-3210",
    "notes": "VIP customer",
    "date_created": "2025-10-20T13:00:00Z",
    "date_modified": "2025-10-28T09:20:00Z",
};

export const customerUpdated = createTrigger({
    auth: bigcommerceAuth,
    name: 'customer_updated',
    displayName: 'Customer Updated',
    description: 'Triggers when a customer is updated. (Requires manual webhook setup in BigCommerce: `store/customer/updated`).',
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

        if (payload.scope !== 'store/customer/updated' || payload.data.type !== 'customer') {
            return [];
        }

        try {
            const client = new BigCommerceClient(context.auth as BigCommerceAuth);
            const customer = await client.getCustomerById(payload.data.id);
            
            return [customer];
        } catch (error) {
            console.error(`Error fetching updated BigCommerce customer ${payload.data.id}`, error);
            return [];
        }
    },

    async test(context) {
        return [sampleData];
    }
});