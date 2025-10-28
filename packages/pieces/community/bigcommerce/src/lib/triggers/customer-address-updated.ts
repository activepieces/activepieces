
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
    "id": 1,
    "customer_id": 42,
    "first_name": "Jon", 
    "last_name": "Smith",
    "company": "BC",
    "street_1": "1234 Fake Street", 
    "street_2": "Apt 101",
    "city": "Austin",
    "state_or_province": "TX",
    "postal_code": "78610",
    "country_code": "US",
    "phone": "123-456-7890",
    "address_type": "residential",
    "country": "United States"
};

export const customerAddressUpdated = createTrigger({
    auth: bigcommerceAuth,
    name: 'customer_address_updated',
    displayName: 'Customer Address Updated',
    description: 'Triggers when a customer address is updated. (Requires manual webhook setup in BigCommerce: `store/customer/address/updated`).',
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

        if (payload.scope !== 'store/customer/address/updated') {
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
            console.error(`Error fetching updated BigCommerce address ${addressId} for customer ${customerId}`, error);
            return [];
        }
    },

    async test(context) {
        return [sampleData];
    }
});