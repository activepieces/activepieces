import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { stripeCommon } from '../common';
import { stripeAuth } from '../..';

export const stripeCanceledSubscription = createTrigger({
    auth: stripeAuth,
    name: 'canceled_subscription',
    displayName: 'Canceled Subscription',
    description: 'Fires when a subscription is cancelled (by user or end of billing cycle).',
    props: {},
    sampleData: {
        "id": "sub_123456789",
        "object": "subscription",
        "status": "canceled",
        "customer": "cus_123456789",
        "cancel_at_period_end": false,
        "canceled_at": 1702588182,
        "ended_at": 1702588182,
        "current_period_end": 1705180182,
        "current_period_start": 1702588182,
        "items": {
            "object": "list",
            "data": [
                {
                    "id": "si_12345",
                    "price": {
                        "id": "price_12345",
                        "product": "prod_12345"
                    }
                }
            ]
        }
    },
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
        const webhook = await stripeCommon.subscribeWebhook(
            ['customer.subscription.deleted', 'customer.subscription.updated'],
            context.webhookUrl,
            context.auth
        );
        await context.store.put<WebhookInformation>('_canceled_subscription_trigger', {
            webhookId: webhook.id,
        });
    },
    async onDisable(context) {
        const response = await context.store.get<WebhookInformation>(
            '_canceled_subscription_trigger'
        );
        if (response !== null && response !== undefined) {
            await stripeCommon.unsubscribeWebhook(response.webhookId, context.auth);
        }
    },
    async run(context) {
        const payload = context.payload.body as PayloadBody;
        const eventType = payload.type;
        const subscription = payload.data.object;

        // This event fires when a subscription is truly deleted/canceled.
        if (eventType === 'customer.subscription.deleted') {
            return [subscription];
        }

        // This event fires on any update, so we must check if the update
        // was specifically to schedule a cancellation.
        if (eventType === 'customer.subscription.updated' && subscription.cancel_at_period_end === true) {
            return [subscription];
        }

        return [];
    },
});

type PayloadBody = {
    type: string;
    data: {
        object: {
            cancel_at_period_end: boolean;
        };
    };
};

interface WebhookInformation {
    webhookId: string;
}