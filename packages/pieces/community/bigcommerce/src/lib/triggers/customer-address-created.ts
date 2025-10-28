

import { createTrigger, TriggerStrategy } from "@activepieces/pieces-framework";
import { bigcommerceAuth, BigCommerceAuth } from "../common/auth";
import { BigCommerceClient } from "../common/client";

interface WebhookPayload {
    scope: string; 
    store_id: string;
    data: {
        type: string; 
        id: number;   
        address: {    
            customer_id: number;
        }
    };
    hash: string;
    created_at: number; 
    producer: string;
}

const sampleData = {
    "id": 123,
    "customer_id": 456,
    "first_name": "Jane",
    "last_name": "Doe",
    "company": "Example Corp",
    "street_1": "456 Sunset Blvd",
    "street_2": "",
    "city": "San Francisco",
    "state_or_province": "CA",
    "postal_code": "94107",
    "country_code": "US",
    "phone": "444-555-6666",
    "address_type": "residential",
    "country": "United States"
};

export const customerAddressCreated = createTrigger({
    auth: bigcommerceAuth,
    name: 'customer_address_created',
    displayName: 'Customer Address Created',
    description: 'Triggers when a new customer address is created. (Requires manual webhook setup in BigCommerce: `store/customer/address/created`).',
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

        if (payload.scope !== 'store/customer/address/created') {
             console.log(`Webhook received for scope ${payload.scope}, ignoring.`);
            return [];
        }

        const addressId = payload.data?.id;
        const customerId = payload.data?.address?.customer_id;

        if (!addressId || !customerId) {
            console.error("Webhook payload missing address or customer ID:", payload);
            return [];
        }

        try {
            const client = new BigCommerceClient(context.auth as BigCommerceAuth);
            const address = await client.getAddressById(customerId, addressId);
            
            return [address];
        } catch (error) {
            console.error(`Error fetching BigCommerce address ${addressId} for customer ${customerId}`, error);
            return [];
        }
    },

    async test(context) {
        return [sampleData];
    }
});