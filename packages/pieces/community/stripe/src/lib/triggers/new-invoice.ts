
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';
export const newInvoice = createTrigger({
    auth: stripeAuth,
    name: 'newInvoice',
    displayName: 'New Invoice',
    description: 'Triggers when an invoice is created. Supports filters like status, customer, subscription.',
    props: {},
    sampleData: {
        "id": "evt_1NyWxcLkdIwHu7ixPQr4i2TC",
        "object": "event",
        "api_version": "2023-10-16",
        "created": 1697665432,
        "data": {
            "object": {
                "id": "in_1NyWxcLkdIwHu7ixTH5vhzXD",
                "object": "invoice",
                "account_country": "US",
                "account_name": "Example, Inc.",
                "account_tax_ids": null,
                "amount_due": 2500,
                "amount_paid": 0,
                "amount_remaining": 2500,
                "application": null,
                "application_fee_amount": null,
                "attempt_count": 0,
                "attempted": false,
                "auto_advance": true,
                "automatic_tax": {
                    "enabled": false,
                    "status": null
                },
                "billing_reason": "manual",
                "charge": null,
                "collection_method": "charge_automatically",
                "created": 1697665432,
                "currency": "usd",
                "custom_fields": null,
                "customer": "cus_PK9xVLwXy75cRt",
                "customer_address": {
                    "city": "San Francisco",
                    "country": "US",
                    "line1": "123 Market St",
                    "line2": "#456",
                    "postal_code": "94107",
                    "state": "CA"
                },
                "customer_email": "customer@example.com",
                "customer_name": "Jenny Rosen",
                "customer_phone": "+15551234567",
                "customer_shipping": null,
                "customer_tax_exempt": "none",
                "customer_tax_ids": [],
                "default_payment_method": null,
                "default_source": null,
                "default_tax_rates": [],
                "description": "Invoice for Services",
                "discount": null,
                "discounts": [],
                "due_date": 1698270232,
                "effective_at": null,
                "ending_balance": null,
                "footer": "Thank you for your business!",
                "hosted_invoice_url": "https://invoice.stripe.com/i/acct_1MlwKrLkdIwHu7ix/test_YWNjdF8xTWx3S3JMa2RJd0h1N2l4LF9QSzl4N1pUZmZCcDVBRVdXS1c3RXZYc0dTbWRBSzk4LDcwNzUyMDQ00200nKbkruvJ",
                "invoice_pdf": "https://pay.stripe.com/invoice/acct_1MlwKrLkdIwHu7ix/test_YWNjdF8xTWx3S3JMa2RJd0h1N2l4LF9QSzl4N1pUZmZCcDVBRVdXS1c3RXZYc0dTbWRBSzk4LDcwNzUyMDQ00200nKbkruvJ/pdf",
                "last_finalization_error": null,
                "latest_revision": null,
                "lines": {
                    "object": "list",
                    "data": [
                        {
                            "id": "il_1NyWxcLkdIwHu7ix12ZvRceS",
                            "object": "line_item",
                            "amount": 2500,
                            "amount_excluding_tax": 2500,
                            "currency": "usd",
                            "description": "Professional Services",
                            "discount_amounts": [],
                            "discountable": true,
                            "discounts": [],
                            "livemode": false,
                            "metadata": {},
                            "period": {
                                "end": 1697665432,
                                "start": 1697665432
                            },
                            "price": {
                                "id": "price_1NyWxbLkdIwHu7ixVpRJ2Ax8",
                                "object": "price",
                                "active": true,
                                "billing_scheme": "per_unit",
                                "created": 1697665431,
                                "currency": "usd",
                                "custom_unit_amount": null,
                                "livemode": false,
                                "lookup_key": null,
                                "metadata": {},
                                "nickname": null,
                                "product": "prod_PK9x4ZJy1YWs7M",
                                "recurring": null,
                                "tax_behavior": "unspecified",
                                "tiers_mode": null,
                                "transform_quantity": null,
                                "type": "one_time",
                                "unit_amount": 2500,
                                "unit_amount_decimal": "2500"
                            },
                            "proration": false,
                            "proration_details": {
                                "credited_items": null
                            },
                            "quantity": 1,
                            "subscription": null,
                            "tax_amounts": [],
                            "tax_rates": [],
                            "type": "invoiceitem",
                            "unit_amount_excluding_tax": "2500"
                        }
                    ],
                    "has_more": false,
                    "total_count": 1,
                    "url": "/v1/invoices/in_1NyWxcLkdIwHu7ixTH5vhzXD/lines"
                },
                "livemode": false,
                "metadata": {
                    "order_id": "5678"
                },
                "next_payment_attempt": 1697669032,
                "number": "INV-0001",
                "on_behalf_of": null,
                "paid": false,
                "paid_out_of_band": false,
                "payment_intent": null,
                "payment_settings": {
                    "default_mandate": null,
                    "payment_method_options": null,
                    "payment_method_types": null
                },
                "period_end": 1697665432,
                "period_start": 1697665432,
                "post_payment_credit_notes_amount": 0,
                "pre_payment_credit_notes_amount": 0,
                "quote": null,
                "receipt_number": null,
                "rendering_options": null,
                "starting_balance": 0,
                "statement_descriptor": null,
                "status": "draft",
                "status_transitions": {
                    "finalized_at": null,
                    "marked_uncollectible_at": null,
                    "paid_at": null,
                    "voided_at": null
                },
                "subscription": null,
                "subtotal": 2500,
                "subtotal_excluding_tax": 2500,
                "tax": null,
                "test_clock": null,
                "total": 2500,
                "total_discount_amounts": [],
                "total_excluding_tax": 2500,
                "total_tax_amounts": [],
                "transfer_data": null,
                "webhooks_delivered_at": null
            }
        },
        "livemode": false,
        "pending_webhooks": 2,
        "request": {
            "id": "req_PK9x7ZTffBp5A",
            "idempotency_key": "f6e07b40-5a34-4cd1-8114-cf58b9a23adf"
        },
        "type": "invoice.created"
    },
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
        const webhook = await stripeCommon.subscribeWebhook(
            'invoice.created',
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