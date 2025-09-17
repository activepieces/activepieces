import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { stripeCommon } from '../common';
import { stripeAuth } from '../..';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const stripeUpdatedSubscription = createTrigger({
    auth: stripeAuth,
    name: 'updated_subscription',
    displayName: 'Updated Subscription',
    description: 'Fires when an existing subscription is changed.',
    props: {},
    sampleData: {
        "id": "sub_1MWMJXKZ0dZRqLEKJX80JXfv",
        "object": "subscription",
        "application": null,
        "application_fee_percent": null,
        "automatic_tax": { "enabled": true },
        "billing_cycle_anchor": 1675181047,
        "billing_thresholds": null,
        "cancel_at": null,
        "cancel_at_period_end": true,
        "canceled_at": null,
        "collection_method": "charge_automatically",
        "created": 1675181047,
        "currency": "usd",
        "current_period_end": 1677600247,
        "current_period_start": 1675181047,
        "customer": "cus_NGtvUQ18FJXcGI",
        "items": {
            "object": "list",
            "data": [
                {
                    "id": "si_NGu7pb7hS3Rps3",
                    "object": "subscription_item",
                    "price": { "id": "price_1MWLz3KZ0dZRqLEK06gRMHCF" },
                    "quantity": 2
                }
            ]
        },
        "latest_invoice": "in_1MWMJXKZ0dZRqLEKIu4a51u7",
        "livemode": false,
        "metadata": {},
        "start_date": 1675181047,
        "status": "active"
    },
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
        const webhook = await stripeCommon.subscribeWebhook(
            ['customer.subscription.updated'],
            context.webhookUrl,
            context.auth
        );
        await context.store.put<WebhookInformation>('_updated_subscription_trigger', {
            webhookId: webhook.id,
        });
    },
    async onDisable(context) {
        const response = await context.store.get<WebhookInformation>(
            '_updated_subscription_trigger'
        );
        if (response !== null && response !== undefined) {
            await stripeCommon.unsubscribeWebhook(response.webhookId, context.auth);
        }
    },
    async test(context) {
        const response = await httpClient.sendRequest<{ data: unknown[] }>({
            method: HttpMethod.GET,
            url: `${stripeCommon.baseUrl}/subscriptions`,
            headers: {
                Authorization: 'Bearer ' + context.auth,
            },
            queryParams: {
                limit: '1',
            },
        });
        return response.body.data;
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