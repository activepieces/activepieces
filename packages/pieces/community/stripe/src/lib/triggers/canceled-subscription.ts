
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { stripeCommon } from '../common';
import { stripeAuth } from '../../';
export const canceledSubscription = createTrigger({
    auth: stripeAuth,
    name: 'canceledSubscription',
    displayName: 'Canceled Subscription',
    description: 'Triggers when a subscription is cancelled (by user or end of billing cycle). ',
    props: {},
    sampleData: {
        "id": "evt_1NyaWzLkdIwHu7ixH5qYnVcR",
        "object": "event",
        "api_version": "2023-10-16",
        "created": 1697684321,
        "data": {
            "object": {
                "id": "sub_1NyaWwLkdIwHu7ixR7jcFhU3",
                "object": "subscription",
                "application": null,
                "application_fee_percent": null,
                "automatic_tax": {
                    "enabled": false
                },
                "billing_cycle_anchor": 1697684320,
                "billing_thresholds": null,
                "cancel_at": null,
                "cancel_at_period_end": false,
                "canceled_at": 1697684321,
                "cancellation_details": {
                    "comment": "Customer requested to cancel service",
                    "feedback": "customer_service",
                    "reason": "cancellation_requested"
                },
                "collection_method": "charge_automatically",
                "created": 1697684320,
                "currency": "usd",
                "current_period_end": 1700362720,
                "current_period_start": 1697684320,
                "customer": "cus_PKDTYlwDvKcSTp",
                "days_until_due": null,
                "default_payment_method": null,
                "default_source": null,
                "default_tax_rates": [],
                "description": null,
                "discount": null,
                "ended_at": 1697684321,
                "items": {
                    "object": "list",
                    "data": [
                        {
                            "id": "si_PKDTgFf7UZlMvx",
                            "object": "subscription_item",
                            "billing_thresholds": null,
                            "created": 1697684320,
                            "metadata": {},
                            "plan": {
                                "id": "price_1NyaWuLkdIwHu7ix4O9cJeAn",
                                "object": "plan",
                                "active": true,
                                "aggregate_usage": null,
                                "amount": 1500,
                                "amount_decimal": "1500",
                                "billing_scheme": "per_unit",
                                "created": 1697684318,
                                "currency": "usd",
                                "interval": "month",
                                "interval_count": 1,
                                "livemode": false,
                                "metadata": {},
                                "nickname": "Basic Plan",
                                "product": "prod_PKDTdrqWt9arDU",
                                "tiers_mode": null,
                                "transform_usage": null,
                                "trial_period_days": null,
                                "usage_type": "licensed"
                            },
                            "price": {
                                "id": "price_1NyaWuLkdIwHu7ix4O9cJeAn",
                                "object": "price",
                                "active": true,
                                "billing_scheme": "per_unit",
                                "created": 1697684318,
                                "currency": "usd",
                                "custom_unit_amount": null,
                                "livemode": false,
                                "lookup_key": null,
                                "metadata": {},
                                "nickname": "Basic Plan",
                                "product": "prod_PKDTdrqWt9arDU",
                                "recurring": {
                                    "aggregate_usage": null,
                                    "interval": "month",
                                    "interval_count": 1,
                                    "trial_period_days": null,
                                    "usage_type": "licensed"
                                },
                                "tax_behavior": "unspecified",
                                "tiers_mode": null,
                                "transform_quantity": null,
                                "type": "recurring",
                                "unit_amount": 1500,
                                "unit_amount_decimal": "1500"
                            },
                            "quantity": 1,
                            "subscription": "sub_1NyaWwLkdIwHu7ixR7jcFhU3",
                            "tax_rates": []
                        }
                    ],
                    "has_more": false,
                    "total_count": 1,
                    "url": "/v1/subscription_items?subscription=sub_1NyaWwLkdIwHu7ixR7jcFhU3"
                },
                "latest_invoice": "in_1NyaWwLkdIwHu7ixPXEhV5XL",
                "livemode": false,
                "metadata": {
                    "user_id": "12345"
                },
                "next_pending_invoice_item_invoice": null,
                "on_behalf_of": null,
                "pause_collection": null,
                "payment_settings": {
                    "payment_method_options": null,
                    "payment_method_types": null,
                    "save_default_payment_method": "off"
                },
                "pending_invoice_item_interval": null,
                "pending_setup_intent": null,
                "pending_update": null,
                "plan": {
                    "id": "price_1NyaWuLkdIwHu7ix4O9cJeAn",
                    "object": "plan",
                    "active": true,
                    "aggregate_usage": null,
                    "amount": 1500,
                    "amount_decimal": "1500",
                    "billing_scheme": "per_unit",
                    "created": 1697684318,
                    "currency": "usd",
                    "interval": "month",
                    "interval_count": 1,
                    "livemode": false,
                    "metadata": {},
                    "nickname": "Basic Plan",
                    "product": "prod_PKDTdrqWt9arDU",
                    "tiers_mode": null,
                    "transform_usage": null,
                    "trial_period_days": null,
                    "usage_type": "licensed"
                },
                "quantity": 1,
                "schedule": null,
                "start_date": 1697684320,
                "status": "canceled",
                "test_clock": null,
                "transfer_data": null,
                "trial_end": null,
                "trial_start": null
            },
            "previous_attributes": {
                "status": "active",
                "canceled_at": null,
                "ended_at": null
            }
        },
        "livemode": false,
        "pending_webhooks": 2,
        "request": {
            "id": "req_PKDTn5sqz3W7Kr",
            "idempotency_key": "8b93f8c7-d15e-4e9c-b12a-88f4e27c2d1f"
        },
        "type": "customer.subscription.deleted"
    },
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
        const webhook = await stripeCommon.subscribeWebhook(
            'customer.subscription.deleted',
            context.webhookUrl,
            context.auth
        );
        await context.store.put<WebhookInformation>('_new_customer_trigger', {
            webhookId: webhook.id,
        });
    },
    async onDisable(context) {
        const response = await context.store?.get<WebhookInformation>(
            '_new_customer_trigger'
        );
        if (response !== null && response !== undefined) {
            await stripeCommon.unsubscribeWebhook(response.webhookId, context.auth);
        }
    },
    async run(context) {
        const payloadBody = context.payload.body as PayloadBody;
        return [payloadBody.data.object];
    }
})


type PayloadBody = {
    data: {
        object: unknown;
    };
};
interface WebhookInformation {
    webhookId: string;
}