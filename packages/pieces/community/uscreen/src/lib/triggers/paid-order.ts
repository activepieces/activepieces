

import { createTrigger, TriggerStrategy } from "@activepieces/pieces-framework";
import { DedupeStrategy, Polling, pollingHelper } from "@activepieces/pieces-common";
import { uscreenAuth } from "../common/auth";
import { UscreenClient, UscreenInvoice } from "../common/client";

const polling: Polling<string, {}> = {
    strategy: DedupeStrategy.TIMEBASED,
    

    items: async ({ auth, propsValue, lastFetchEpochMS }) => {
        const client = new UscreenClient(auth);
        
        const response = await client.getInvoices({
            sort_by: 'paid_at:desc',
            status: 'paid',       
            per_page: 50             
        });

        const newInvoices = response.items
            .filter(invoice => {
                const paidAtTime = invoice.paid_at ? new Date(invoice.paid_at).getTime() : 0;
                return paidAtTime > lastFetchEpochMS;
            });

        return newInvoices.map((invoice) => {
            return {
                epochMilliSeconds: new Date(invoice.paid_at).getTime(),
                data: invoice,
            };
        });
    }
};

export const paidOrder = createTrigger({
    auth: uscreenAuth,
    name: 'paid_order',
    displayName: 'Paid Order',
    description: 'Fires when a payment is processed for subscriptions, bundles, or content.',
    props: {}, 
    sampleData: {
        "id": "123456",
        "title": "Masterclass Bundle",
        "total": "49.99 USD",
        "amount": "39.99 USD",
        "discount": "10.00 USD",
        "offer_id": "98765",
        "customer_name": "Jane Smith",
        "customer_email": "customer@example.com",
        "country_code": "US",
        "transaction_id": "tr_1001abcd",
        "ip_address": "192.168.1.101",
        "origin": "Stripe",
        "coupon": "WELCOME10",
        "event": "order_paid",
        "status": "paid",
        "paid_at": "2025-10-27T13:00:00Z"
    },
    type: TriggerStrategy.POLLING,
    
    onEnable: (context) => pollingHelper.onEnable(polling, context),
    onDisable: (context) => pollingHelper.onDisable(polling, context),
    run: (context) => pollingHelper.poll(polling, context),
    test: (context) => pollingHelper.test(polling, context),
});