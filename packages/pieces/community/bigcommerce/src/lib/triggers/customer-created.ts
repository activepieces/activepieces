
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
    "company": "Acme Inc.",
    "first_name": "John",
    "last_name": "Smith",
    "email": "john.smith@example.com",
    "phone": "123-456-7890",
    "notes": "Sample customer",
    "date_created": "2025-10-28T10:32:00Z",
    "date_modified": "2025-10-28T10:32:00Z"
};

export const customerCreated = createTrigger({
    auth: bigcommerceAuth,
    name: 'customer_created',
    displayName: 'Customer Created',
    description: 'Triggers when a new customer is created. (Requires manual webhook setup in BigCommerce: `store/customer/created`).',
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

        if (payload.scope !== 'store/customer/created' || payload.data.type !== 'customer') {
            return [];
        }

        try {
            const client = new BigCommerceClient(context.auth as BigCommerceAuth);
            const customer = await client.getCustomerById(payload.data.id);
            
            return [customer];
        } catch (error) {
            console.error(`Error fetching BigCommerce customer ${payload.data.id}`, error);
            return [];
        }
    },

    async test(context) {
        return [sampleData];
    }
});