import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { stripeCommon } from '../common';
import { stripeAuth } from '../..';

export const stripeInvoicePaymentFailed = createTrigger({
    auth: stripeAuth,
    name: 'invoice_payment_failed',
    displayName: 'Invoice Payment Failed',
    description: 'Fires when a payment against an invoice fails.',
    props: {},
    sampleData: {
        "id": "in_1OaG8y2eZvKYlo2CU90f8mBC",
        "object": "invoice",
        "customer": "cus_123456789",
        "subscription": "sub_123456789",
        "status": "open",
        "attempted": true,
        "amount_due": 2000,
        "amount_paid": 0,
        "amount_remaining": 2000,
        "currency": "usd",
        "created": 1702588182,
        "next_payment_attempt": 1702674582,
        "charge": "ch_3OaG8y2eZvKYlo2C0c83a7W0",
        "last_payment_error": {
          "code": "card_declined",
          "decline_code": "generic_decline",
          "doc_url": "https://stripe.com/docs/error-codes/card-declined",
          "message": "Your card was declined.",
          "payment_intent": {
            "id": "pi_3OaG8y2eZvKYlo2C0h31dZtv"
          },
          "type": "card_error"
        },
        "hosted_invoice_url": "https://invoice.stripe.com/i/...",
        "paid": false
    },
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
        const webhook = await stripeCommon.subscribeWebhook(
            ['invoice.payment_failed'],
            context.webhookUrl,
            context.auth
        );
        await context.store.put<WebhookInformation>('_invoice_payment_failed_trigger', {
            webhookId: webhook.id,
        });
    },
    async onDisable(context) {
        const response = await context.store.get<WebhookInformation>(
            '_invoice_payment_failed_trigger'
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