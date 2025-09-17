import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { stripeCommon } from '../common';
import { stripeAuth } from '../..';

export const stripeNewCharge = createTrigger({
    auth: stripeAuth,
    name: 'new_charge',
    displayName: 'New Charge',
    description: 'Fires when a charge is successfully completed.',
    props: {},
    sampleData: {
        "id": "ch_3LK3h22eZvKYlo2C1N242G2a",
        "object": "charge",
        "amount": 2000,
        "amount_captured": 2000,
        "amount_refunded": 0,
        "application": null,
        "application_fee": null,
        "application_fee_amount": null,
        "balance_transaction": "txn_1032HU2eZvKYlo2CEd222222",
        "billing_details": {
            "address": {
                "city": null,
                "country": "US",
                "line1": null,
                "line2": null,
                "postal_code": "12345",
                "state": null
            },
            "email": "jenny.rosen@example.com",
            "name": "Jenny Rosen",
            "phone": null
        },
        "captured": true,
        "created": 1689172533,
        "currency": "usd",
        "customer": "cus_123456789",
        "description": "My First Test Charge",
        "paid": true,
        "payment_method": "pm_1LK3h12eZvKYlo2CFzG4c42z",
        "receipt_url": "https://pay.stripe.com/receipts/...",
        "status": "succeeded"
    },
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
        const webhook = await stripeCommon.subscribeWebhook(
            ['charge.succeeded'],
            context.webhookUrl,
            context.auth
        );
        await context.store.put<WebhookInformation>('_new_charge_trigger', {
            webhookId: webhook.id,
        });
    },
    async onDisable(context) {
        const response = await context.store.get<WebhookInformation>(
            '_new_charge_trigger'
        );
        if (response !== null && response !== undefined) {
            await stripeCommon.unsubscribeWebhook(response.webhookId, context.auth);
        }
    },
    async run(context) {
        const payloadBody = context.payload.body as PayloadBody;
        return [payloadBody.data.object];
    },
});

type PayloadBody = {
    data: {
        object: unknown;
    };
};

interface WebhookInformation {
    webhookId: string;
}