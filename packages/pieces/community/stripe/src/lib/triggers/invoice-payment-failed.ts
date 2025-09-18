
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { stripeCommon } from '../common';
import { stripeAuth } from '../../';
export const invoicePaymentFailed = createTrigger({
    auth: stripeAuth,
    name: 'invoicePaymentFailed',
    displayName: 'Invoice Payment Failed',
    description: 'Triggers when a payment against an invoice fails.',
    props: {},
    sampleData: {
        "id": "evt_1NyZ8rLkdIwHu7ixKjRt5sW9",
        "object": "event",
        "api_version": "2023-10-16",
        "created": 1697678901,
        "data": {
            "object": {
                "id": "in_1NyZ8qLkdIwHu7ixJ4tVm2pD",
                "object": "invoice",
                "account_country": "US",
                "account_name": "Example, Inc.",
                "account_tax_ids": null,
                "amount_due": 5000,
                "amount_paid": 0,
                "amount_remaining": 5000,
                "application": null,
                "application_fee_amount": null,
                "attempt_count": 1,
                "attempted": true,
                "auto_advance": true,
                "automatic_tax": {
                    "enabled": false,
                    "status": null
                },
                "billing_reason": "subscription_create",
                "charge": "ch_3NyZ8qLkdIwHu7ix1rHFe5BM",
                "collection_method": "charge_automatically",
                "created": 1697678900,
                "currency": "usd",
                "custom_fields": null,
                "customer": "cus_PKBz7LmnXtHfRp",
                "customer_address": null,
                "customer_email": "customer@example.com",
                "customer_name": "Jenny Rosen",
                "customer_phone": null,
                "customer_shipping": null,
                "customer_tax_exempt": "none",
                "customer_tax_ids": [],
                "default_payment_method": null,
                "default_source": null,
                "default_tax_rates": [],
                "description": null,
                "discount": null,
                "discounts": [],
                "due_date": null,
                "effective_at": 1697678900,
                "ending_balance": 0,
                "footer": null,
                "hosted_invoice_url": "https://invoice.stripe.com/i/acct_1MlwKrLkdIwHu7ix/test_YWNjdF8xTWx3S3JMa2RJd0h1N2l4LF9QS0J6ZmJpNTlYeVg0NHdTOHlzR21KcXQyakZ0Qkw2LDcwNzg0OTk20200FaJ9DxvX",
                "invoice_pdf": "https://pay.stripe.com/invoice/acct_1MlwKrLkdIwHu7ix/test_YWNjdF8xTWx3S3JMa2RJd0h1N2l4LF9QS0J6ZmJpNTlYeVg0NHdTOHlzR21KcXQyakZ0Qkw2LDcwNzg0OTk20200FaJ9DxvX/pdf",
                "last_finalization_error": null,
                "latest_revision": null,
                "lines": {
                    "object": "list",
                    "data": [
                        {
                            "id": "il_1NyZ8qLkdIwHu7ixMTfLvzsp",
                            "object": "line_item",
                            "amount": 5000,
                            "amount_excluding_tax": 5000,
                            "currency": "usd",
                            "description": "1 × Premium Plan (at $50.00 / month)",
                            "discount_amounts": [],
                            "discountable": true,
                            "discounts": [],
                            "livemode": false,
                            "metadata": {},
                            "period": {
                                "end": 1700357300,
                                "start": 1697678900
                            },
                            "plan": {
                                "id": "price_1NyZ8oLkdIwHu7ixK8GYeXzt",
                                "object": "plan",
                                "active": true,
                                "aggregate_usage": null,
                                "amount": 5000,
                                "amount_decimal": "5000",
                                "billing_scheme": "per_unit",
                                "created": 1697678898,
                                "currency": "usd",
                                "interval": "month",
                                "interval_count": 1,
                                "livemode": false,
                                "metadata": {},
                                "nickname": null,
                                "product": "prod_PKBzVKjtXm4pL9",
                                "tiers_mode": null,
                                "transform_usage": null,
                                "trial_period_days": null,
                                "usage_type": "licensed"
                            },
                            "price": {
                                "id": "price_1NyZ8oLkdIwHu7ixK8GYeXzt",
                                "object": "price",
                                "active": true,
                                "billing_scheme": "per_unit",
                                "created": 1697678898,
                                "currency": "usd",
                                "custom_unit_amount": null,
                                "livemode": false,
                                "lookup_key": null,
                                "metadata": {},
                                "nickname": null,
                                "product": "prod_PKBzVKjtXm4pL9",
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
                                "unit_amount": 5000,
                                "unit_amount_decimal": "5000"
                            },
                            "proration": false,
                            "proration_details": {
                                "credited_items": null
                            },
                            "quantity": 1,
                            "subscription": "sub_1NyZ8qLkdIwHu7ixslFc3WnU",
                            "subscription_item": "si_PKBzkgUxEd6vAT",
                            "tax_amounts": [],
                            "tax_rates": [],
                            "type": "subscription",
                            "unit_amount_excluding_tax": "5000"
                        }
                    ],
                    "has_more": false,
                    "total_count": 1,
                    "url": "/v1/invoices/in_1NyZ8qLkdIwHu7ixJ4tVm2pD/lines"
                },
                "livemode": false,
                "metadata": {},
                "next_payment_attempt": 1697682501,
                "number": "F9E5FD21-0001",
                "on_behalf_of": null,
                "paid": false,
                "paid_out_of_band": false,
                "payment_intent": "pi_3NyZ8qLkdIwHu7ix1BrLQzmK",
                "payment_settings": {
                    "default_mandate": null,
                    "payment_method_options": null,
                    "payment_method_types": null
                },
                "period_end": 1697678900,
                "period_start": 1697678900,
                "post_payment_credit_notes_amount": 0,
                "pre_payment_credit_notes_amount": 0,
                "quote": null,
                "receipt_number": null,
                "rendering_options": null,
                "starting_balance": 0,
                "statement_descriptor": null,
                "status": "open",
                "status_transitions": {
                    "finalized_at": 1697678900,
                    "marked_uncollectible_at": null,
                    "paid_at": null,
                    "voided_at": null
                },
                "subscription": "sub_1NyZ8qLkdIwHu7ixslFc3WnU",
                "subtotal": 5000,
                "subtotal_excluding_tax": 5000,
                "tax": null,
                "test_clock": null,
                "total": 5000,
                "total_discount_amounts": [],
                "total_excluding_tax": 5000,
                "total_tax_amounts": [],
                "transfer_data": null,
                "webhooks_delivered_at": null
            }
        },
        "livemode": false,
        "pending_webhooks": 2,
        "request": {
            "id": "req_PKBzfbi59XyX4",
            "idempotency_key": "03a623b8-6a52-4d68-8c9c-f142ba5a9c7d"
        },
        "type": "invoice.payment_failed"
    },
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
        const webhook = await stripeCommon.subscribeWebhook(
            'invoice.payment_failed',
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