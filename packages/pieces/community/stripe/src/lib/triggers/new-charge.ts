
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { stripeCommon } from '../common';
import { stripeAuth } from '../..';
export const newCharge = createTrigger({
    auth: stripeAuth,
    name: 'newCharge',
    displayName: 'New Charge',
    description: 'Triggers when a charge is successfully completed.',
    props: {},
    sampleData:
    {
        "id": "evt_1NyUSgLkdIwHu7ixTmIbSJ09",
        "object": "event",
        "api_version": "2023-10-16",
        "created": 1697654321,
        "data": {
            "object": {
                "id": "ch_3NyUSfLkdIwHu7ix0CJQZGpb",
                "object": "charge",
                "amount": 2000,
                "amount_captured": 2000,
                "amount_refunded": 0,
                "application": null,
                "application_fee": null,
                "application_fee_amount": null,
                "balance_transaction": "txn_3NyUSfLkdIwHu7ix0qhDjz4H",
                "billing_details": {
                    "address": {
                        "city": null,
                        "country": null,
                        "line1": null,
                        "line2": null,
                        "postal_code": null,
                        "state": null
                    },
                    "email": "customer@example.com",
                    "name": "Jenny Rosen",
                    "phone": null
                },
                "calculated_statement_descriptor": "EXAMPLE INC",
                "captured": true,
                "created": 1697654321,
                "currency": "usd",
                "customer": "cus_PK9DFLhRYO1cez",
                "description": "Payment for order #1234",
                "destination": null,
                "dispute": null,
                "disputed": false,
                "failure_balance_transaction": null,
                "failure_code": null,
                "failure_message": null,
                "fraud_details": {},
                "invoice": null,
                "livemode": false,
                "metadata": {
                    "order_id": "1234"
                },
                "on_behalf_of": null,
                "order": null,
                "outcome": {
                    "network_status": "approved_by_network",
                    "reason": null,
                    "risk_level": "normal",
                    "risk_score": 22,
                    "seller_message": "Payment complete.",
                    "type": "authorized"
                },
                "paid": true,
                "payment_intent": "pi_3NyUSfLkdIwHu7ix0BOHss4N",
                "payment_method": "pm_1NyUSfLkdIwHu7ixjQ37JzNV",
                "payment_method_details": {
                    "card": {
                        "brand": "visa",
                        "checks": {
                            "address_line1_check": null,
                            "address_postal_code_check": null,
                            "cvc_check": "pass"
                        },
                        "country": "US",
                        "exp_month": 12,
                        "exp_year": 2025,
                        "fingerprint": "F4XxQL9pZCKRZMrT",
                        "funding": "credit",
                        "installments": null,
                        "last4": "4242",
                        "network": "visa",
                        "three_d_secure": null,
                        "wallet": null
                    },
                    "type": "card"
                },
                "receipt_email": "customer@example.com",
                "receipt_number": null,
                "receipt_url": "https://pay.stripe.com/receipts/payment/CAcaFwoVYWNjdF8xTWx3S3JMa2RJd0h1N2l4KIeN7KcGMgabVmJa5l0",
                "refunded": false,
                "refunds": {
                    "object": "list",
                    "data": [],
                    "has_more": false,
                    "total_count": 0,
                    "url": "/v1/charges/ch_3NyUSfLkdIwHu7ix0CJQZGpb/refunds"
                },
                "review": null,
                "shipping": null,
                "source": null,
                "source_transfer": null,
                "statement_descriptor": null,
                "statement_descriptor_suffix": null,
                "status": "succeeded",
                "transfer_data": null,
                "transfer_group": null
            }
        },
        "livemode": false,
        "pending_webhooks": 2,
        "request": {
            "id": "req_PK9DzcAMMdXPMp",
            "idempotency_key": "5eb46a15-c089-46c7-98f1-2e0cc1016ab4"
        },
        "type": "charge.succeeded"

    },
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
        const webhook = await stripeCommon.subscribeWebhook(
            'charge.succeeded',
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