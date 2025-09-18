
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { stripeCommon } from '../common';
import { stripeAuth } from '../..';
export const newRefund = createTrigger({
    auth: stripeAuth,
    name: 'newRefund',
    displayName: 'New Refund',
    description: 'Triggers when a charge is refunded (full or partial).',
    props: {},
    sampleData: {
        "id": "evt_1NycK5LkdIwHu7ixQmTvPrbF",
        "object": "event",
        "api_version": "2023-10-16",
        "created": 1697691987,
        "data": {
            "object": {
                "id": "ch_3NyZmWLkdIwHu7ix0VW6qhcT",
                "object": "charge",
                "amount": 5000,
                "amount_captured": 5000,
                "amount_refunded": 5000,
                "application": null,
                "application_fee": null,
                "application_fee_amount": null,
                "balance_transaction": "txn_3NyZmWLkdIwHu7ix0nPlCB8P",
                "billing_details": {
                    "address": {
                        "city": null,
                        "country": null,
                        "line1": null,
                        "line2": null,
                        "postal_code": "94107",
                        "state": null
                    },
                    "email": "customer@example.com",
                    "name": "Jenny Rosen",
                    "phone": null
                },
                "calculated_statement_descriptor": "EXAMPLE INC",
                "captured": true,
                "created": 1697681322,
                "currency": "usd",
                "customer": "cus_PKEGvTUVsP2hyX",
                "description": "Order #1234",
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
                    "risk_score": 42,
                    "seller_message": "Payment complete.",
                    "type": "authorized"
                },
                "paid": true,
                "payment_intent": "pi_3NyZmWLkdIwHu7ix0fwf2xVb",
                "payment_method": "pm_1NyZmWLkdIwHu7ixhPnS6HnK",
                "payment_method_details": {
                    "card": {
                        "brand": "visa",
                        "checks": {
                            "address_line1_check": null,
                            "address_postal_code_check": "pass",
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
                "receipt_url": "https://pay.stripe.com/receipts/payment/CAcaFwoVYWNjdF8xTWx3S3JMa2RJd0h1N2l4KImT6qcGMgaO0q8B1Dk",
                "refunded": true,
                "refunds": {
                    "object": "list",
                    "data": [
                        {
                            "id": "re_3NyZmWLkdIwHu7ix0tpiZuAR",
                            "object": "refund",
                            "amount": 5000,
                            "balance_transaction": "txn_3NyZmWLkdIwHu7ix0PwPXsBz",
                            "charge": "ch_3NyZmWLkdIwHu7ix0VW6qhcT",
                            "created": 1697691987,
                            "currency": "usd",
                            "metadata": {
                                "reason": "Customer requested cancellation"
                            },
                            "payment_intent": "pi_3NyZmWLkdIwHu7ix0fwf2xVb",
                            "reason": "requested_by_customer",
                            "receipt_number": null,
                            "source_transfer_reversal": null,
                            "status": "succeeded",
                            "transfer_reversal": null
                        }
                    ],
                    "has_more": false,
                    "total_count": 1,
                    "url": "/v1/charges/ch_3NyZmWLkdIwHu7ix0VW6qhcT/refunds"
                },
                "review": null,
                "shipping": {
                    "address": {
                        "city": "San Francisco",
                        "country": "US",
                        "line1": "123 Market St",
                        "line2": "#456",
                        "postal_code": "94107",
                        "state": "CA"
                    },
                    "carrier": null,
                    "name": "Jenny Rosen",
                    "phone": null,
                    "tracking_number": null
                },
                "source": null,
                "source_transfer": null,
                "statement_descriptor": null,
                "statement_descriptor_suffix": null,
                "status": "succeeded",
                "transfer_data": null,
                "transfer_group": null
            },
            "previous_attributes": {
                "amount_refunded": 0,
                "refunded": false,
                "refunds": {
                    "data": [],
                    "total_count": 0
                }
            }
        },
        "livemode": false,
        "pending_webhooks": 2,
        "request": {
            "id": "req_PKFLZlj04U3Jzn",
            "idempotency_key": "e4db1b78-ee1c-4462-a7f5-21f63b576185"
        },
        "type": "charge.refunded"
    },
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
        const webhook = await stripeCommon.subscribeWebhook(
            'charge.refunded',
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