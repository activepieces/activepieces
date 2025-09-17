import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { stripeCommon } from '../common';
import { stripeAuth } from '../..';

export const stripeCheckoutSessionCompleted = createTrigger({
    auth: stripeAuth,
    name: 'checkout_session_completed',
    displayName: 'Checkout Session Completed',
    description: 'Fires when a Stripe Checkout Session is successfully completed.',
    props: {},
    sampleData: {
        "id": "cs_test_a1B2c3d4...",
        "object": "checkout.session",
        "amount_subtotal": 2000,
        "amount_total": 2000,
        "billing_address_collection": "required",
        "cancel_url": "https://example.com/cancel",
        "client_reference_id": "client_ref_12345",
        "created": 1702591112,
        "currency": "usd",
        "customer": "cus_12345",
        "customer_details": {
          "email": "customer@example.com",
          "name": "John Doe",
          "phone": null,
          "tax_exempt": "none",
          "tax_ids": []
        },
        "customer_email": "customer@example.com",
        "livemode": false,
        "mode": "payment",
        "payment_intent": "pi_12345",
        "payment_status": "paid",
        "status": "complete",
        "success_url": "https://example.com/success",
        "url": null
    },
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
        const webhook = await stripeCommon.subscribeWebhook(
            ['checkout.session.completed'],
            context.webhookUrl,
            context.auth
        );
        await context.store.put<WebhookInformation>('_checkout_session_completed_trigger', {
            webhookId: webhook.id,
        });
    },
    async onDisable(context) {
        const response = await context.store.get<WebhookInformation>(
            '_checkout_session_completed_trigger'
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