import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { stripeCommon } from '../common';
import { stripeAuth } from '../..';

export const stripeNewDispute = createTrigger({
    auth: stripeAuth,
    name: 'new_dispute',
    displayName: 'New Dispute',
    description: 'Fires when a customer disputes a charge.',
    props: {},
    sampleData: {
        "id": "dp_1OaGBdECg9tTZuTgY4s6A3B9",
        "object": "dispute",
        "amount": 1500,
        "balance_transactions": [],
        "charge": "ch_3P645cECg9tTZuTg1e6205AB",
        "created": 1702591111,
        "currency": "usd",
        "evidence": {},
        "evidence_details": {
          "due_by": 1704489599,
          "has_evidence": false,
          "past_due": false,
          "submission_count": 0
        },
        "is_charge_refundable": false,
        "livemode": false,
        "metadata": {},
        "payment_intent": "pi_123456789",
        "reason": "fraudulent",
        "status": "needs_response"
    },
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
        const webhook = await stripeCommon.subscribeWebhook(
            ['charge.dispute.created'],
            context.webhookUrl,
            context.auth
        );
        await context.store.put<WebhookInformation>('_new_dispute_trigger', {
            webhookId: webhook.id,
        });
    },
    async onDisable(context) {
        const response = await context.store.get<WebhookInformation>(
            '_new_dispute_trigger'
        );
        if (response !== null && response !== undefined) {
            await stripeCommon.unsubscribeWebhook(response.webhookId, context.auth);
        }
    },
    async run(context) {
        // The payload is the Dispute object
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