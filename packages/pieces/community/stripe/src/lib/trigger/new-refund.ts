import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { stripeCommon } from '../common';
import { stripeAuth } from '../..';

export const stripeNewRefund = createTrigger({
    auth: stripeAuth,
    name: 'new_refund',
    displayName: 'New Refund',
    description: 'Fires when a charge is refunded (full or partial).',
    props: {},
    sampleData: {
        "id": "ch_3P63hPECg9tTZuTg1e6205QI",
        "object": "charge",
        "amount": 1000,
        "amount_captured": 1000,
        "amount_refunded": 1000,
        "currency": "usd",
        "customer": "cus_P3i5Xp4P5J8g3f",
        "description": "Charge for test@example.com",
        "paid": true,
        "refunded": true,
        "status": "succeeded",
        "refunds": {
          "object": "list",
          "data": [
            {
              "id": "re_3P63hPECg9tTZuTg0bTqWJgR",
              "object": "refund",
              "amount": 1000,
              "balance_transaction": "txn_3P63hPECg9tTZuTg0r4R737g",
              "charge": "ch_3P63hPECg9tTZuTg1e6205QI",
              "created": 1702589587,
              "currency": "usd",
              "status": "succeeded"
            }
          ],
          "has_more": false,
          "total_count": 1,
          "url": "/v1/charges/ch_3P63hPECg9tTZuTg1e6205QI/refunds"
        }
    },
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
        const webhook = await stripeCommon.subscribeWebhook(
            ['charge.refunded'],
            context.webhookUrl,
            context.auth
        );
        await context.store.put<WebhookInformation>('_new_refund_trigger', {
            webhookId: webhook.id,
        });
    },
    async onDisable(context) {
        const response = await context.store.get<WebhookInformation>(
            '_new_refund_trigger'
        );
        if (response !== null && response !== undefined) {
            await stripeCommon.unsubscribeWebhook(response.webhookId, context.auth);
        }
    },
    async run(context) {
        // The payload is the updated Charge object
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