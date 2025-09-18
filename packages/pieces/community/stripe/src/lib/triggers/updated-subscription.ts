
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { stripeCommon } from '../common';
import { stripeAuth } from '../..';
export const updatedSubscription = createTrigger({
    auth: stripeAuth,
    name: 'updatedSubscription',
    displayName: 'Updated Subscription',
    description: 'Triggers when an existing subscription is changed.',
    props: {},
    sampleData: {
        "id": "evt_1NygUELkdIwHu7ixXFYlcT4M",
        "object": "event",
        "api_version": "2023-10-16",
        "created": 1697708300,
        "data": {
            "object": {
                "id": "sub_1NygTsLkdIwHu7ixOgDn1XGV",
                "object": "subscription",
                "application": null,
                "application_fee_percent": null,
                "automatic_tax": {
                    "enabled": false
                },
                "billing_cycle_anchor": 1697708284,
                "billing_thresholds": null,
                "cancel_at": null,
                "cancel_at_period_end": false,
                "canceled_at": null,
                "collection_method": "charge_automatically",
                "created": 1697708284,
                "currency": "usd",
                "current_period_end": 1700386684,
                "current_period_start": 1697708284,
                "customer": "cus_PKJrP0v4k3xYSO",
                "days_until_due": null,
                "default_payment_method": null,
                "default_source": null,
                "default_tax_rates": [],
                "description": "Premium Plan with add-ons",
                "discount": null,
                "ended_at": null,
                "items": {
                    "object": "list",
                    "data": [
                        {
                            "id": "si_PKJr4fb7DvYdJG",
                            "object": "subscription_item",
                            "billing_thresholds": null,
                            "created": 1697708284,
                            "metadata": {},
                            "plan": {
                                "id": "price_1NygToLkdIwHu7ixOahMmWAW",
                                "object": "plan",
                                "active": true,
                                "aggregate_usage": null,
                                "amount": 2000,
                                "amount_decimal": "2000",
                                "billing_scheme": "per_unit",
                                "created": 1697708280,
                                "currency": "usd",
                                "interval": "month",
                                "interval_count": 1,
                                "livemode": false,
                                "metadata": {},
                                "nickname": "Premium Plan",
                                "product": "prod_PKJrrzjYCndQP8",
                                "tiers_mode": null,
                                "transform_usage": null,
                                "trial_period_days": null,
                                "usage_type": "licensed"
                            },
                            "price": {
                                "id": "price_1NygToLkdIwHu7ixOahMmWAW",
                                "object": "price",
                                "active": true,
                                "billing_scheme": "per_unit",
                                "created": 1697708280,
                                "currency": "usd",
                                "custom_unit_amount": null,
                                "livemode": false,
                                "lookup_key": null,
                                "metadata": {},
                                "nickname": "Premium Plan",
                                "product": "prod_PKJrrzjYCndQP8",
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
                                "unit_amount": 2000,
                                "unit_amount_decimal": "2000"
                            },
                            "quantity": 1,
                            "subscription": "sub_1NygTsLkdIwHu7ixOgDn1XGV",
                            "tax_rates": []
                        },
                        {
                            "id": "si_PKJsDSsWbD2PGQ",
                            "object": "subscription_item",
                            "billing_thresholds": null,
                            "created": 1697708300,
                            "metadata": {},
                            "plan": {
                                "id": "price_1NygUBLkdIwHu7ixoWd5eLF5",
                                "object": "plan",
                                "active": true,
                                "aggregate_usage": null,
                                "amount": 500,
                                "amount_decimal": "500",
                                "billing_scheme": "per_unit",
                                "created": 1697708299,
                                "currency": "usd",
                                "interval": "month",
                                "interval_count": 1,
                                "livemode": false,
                                "metadata": {},
                                "nickname": "Extra Storage Add-on",
                                "product": "prod_PKJsN3jAH0MmKz",
                                "tiers_mode": null,
                                "transform_usage": null,
                                "trial_period_days": null,
                                "usage_type": "licensed"
                            },
                            "price": {
                                "id": "price_1NygUBLkdIwHu7ixoWd5eLF5",
                                "object": "price",
                                "active": true,
                                "billing_scheme": "per_unit",
                                "created": 1697708299,
                                "currency": "usd",
                                "custom_unit_amount": null,
                                "livemode": false,
                                "lookup_key": null,
                                "metadata": {},
                                "nickname": "Extra Storage Add-on",
                                "product": "prod_PKJsN3jAH0MmKz",
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
                                "unit_amount": 500,
                                "unit_amount_decimal": "500"
                            },
                            "quantity": 2,
                            "subscription": "sub_1NygTsLkdIwHu7ixOgDn1XGV",
                            "tax_rates": []
                        }
                    ],
                    "has_more": false,
                    "total_count": 2,
                    "url": "/v1/subscription_items?subscription=sub_1NygTsLkdIwHu7ixOgDn1XGV"
                },
                "latest_invoice": "in_1NygUELkdIwHu7ixocKRnUhi",
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
                    "id": "price_1NygToLkdIwHu7ixOahMmWAW",
                    "object": "plan",
                    "active": true,
                    "aggregate_usage": null,
                    "amount": 2000,
                    "amount_decimal": "2000",
                    "billing_scheme": "per_unit",
                    "created": 1697708280,
                    "currency": "usd",
                    "interval": "month",
                    "interval_count": 1,
                    "livemode": false,
                    "metadata": {},
                    "nickname": "Premium Plan",
                    "product": "prod_PKJrrzjYCndQP8",
                    "tiers_mode": null,
                    "transform_usage": null,
                    "trial_period_days": null,
                    "usage_type": "licensed"
                },
                "quantity": 1,
                "schedule": null,
                "start_date": 1697708284,
                "status": "active",
                "test_clock": null,
                "transfer_data": null,
                "trial_end": null,
                "trial_start": null
            },
            "previous_attributes": {
                "description": "Premium Plan",
                "items": {
                    "data": [
                        {
                            "id": "si_PKJr4fb7DvYdJG",
                            "object": "subscription_item",
                            "billing_thresholds": null,
                            "created": 1697708284,
                            "metadata": {},
                            "plan": {
                                "id": "price_1NygToLkdIwHu7ixOahMmWAW",
                                "object": "plan",
                                "active": true,
                                "aggregate_usage": null,
                                "amount": 2000,
                                "amount_decimal": "2000",
                                "billing_scheme": "per_unit",
                                "created": 1697708280,
                                "currency": "usd",
                                "interval": "month",
                                "interval_count": 1,
                                "livemode": false,
                                "metadata": {},
                                "nickname": "Premium Plan",
                                "product": "prod_PKJrrzjYCndQP8",
                                "tiers_mode": null,
                                "transform_usage": null,
                                "trial_period_days": null,
                                "usage_type": "licensed"
                            },
                            "price": {
                                "id": "price_1NygToLkdIwHu7ixOahMmWAW",
                                "object": "price",
                                "active": true,
                                "billing_scheme": "per_unit",
                                "created": 1697708280,
                                "currency": "usd",
                                "custom_unit_amount": null,
                                "livemode": false,
                                "lookup_key": null,
                                "metadata": {},
                                "nickname": "Premium Plan",
                                "product": "prod_PKJrrzjYCndQP8",
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
                                "unit_amount": 2000,
                                "unit_amount_decimal": "2000"
                            },
                            "quantity": 1,
                            "subscription": "sub_1NygTsLkdIwHu7ixOgDn1XGV",
                            "tax_rates": []
                        }
                    ],
                    "total_count": 1
                },
                "latest_invoice": "in_1NygTsLkdIwHu7ix7Anhjl1P"
            }
        },
        "livemode": false,
        "pending_webhooks": 2,
        "request": {
            "id": "req_PKJsl2Sve45DKa",
            "idempotency_key": "7c8d9e1f-6b3a-5c4d-8e9f-2a1b3c4d5e6f"
        },
        "type": "customer.subscription.updated"
    },
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
        const webhook = await stripeCommon.subscribeWebhook(
            'customer.subscription.updated',
            context.webhookUrl,
            context.auth
        );
        await context.store?.put<WebhookInformation>('_payment_failed_trigger', {
            webhookId: webhook.id,
        });
    },
    async onDisable(context) {
        const response = await context.store?.get<WebhookInformation>(
            '_payment_failed_trigger'
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
