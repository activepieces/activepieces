
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { stripeCommon } from '../common';
import { stripeAuth } from '../..';
export const newDispute = createTrigger({
    auth: stripeAuth,
    name: 'newDispute',
    displayName: 'New Dispute',
    description: 'Triggers when a customer disputes a charge.',
    props: {},
    sampleData: {
        "id": "evt_1NydkMLkdIwHu7ix0xYgkZSt",
        "object": "event",
        "api_version": "2023-10-16",
        "created": 1697697432,
        "data": {
            "object": {
                "id": "dp_1NydkLLkdIwHu7ixnTjvQYMX",
                "object": "dispute",
                "amount": 8000,
                "balance_transaction": "txn_1NydkLLkdIwHu7ixG80MaWNe",
                "balance_transactions": [],
                "charge": "ch_3NydkKLkdIwHu7ix0R1p9cWT",
                "created": 1697697431,
                "currency": "usd",
                "evidence": {
                    "access_activity_log": null,
                    "billing_address": null,
                    "cancellation_policy": null,
                    "cancellation_policy_disclosure": null,
                    "cancellation_rebuttal": null,
                    "customer_communication": null,
                    "customer_email_address": null,
                    "customer_name": null,
                    "customer_purchase_ip": null,
                    "customer_signature": null,
                    "duplicate_charge_documentation": null,
                    "duplicate_charge_explanation": null,
                    "duplicate_charge_id": null,
                    "product_description": null,
                    "receipt": null,
                    "refund_policy": null,
                    "refund_policy_disclosure": null,
                    "refund_refusal_explanation": null,
                    "service_date": null,
                    "service_documentation": null,
                    "shipping_address": null,
                    "shipping_carrier": null,
                    "shipping_date": null,
                    "shipping_documentation": null,
                    "shipping_tracking_number": null,
                    "uncategorized_file": null,
                    "uncategorized_text": null
                },
                "evidence_details": {
                    "due_by": 1698451199,
                    "has_evidence": false,
                    "past_due": false,
                    "submission_count": 0
                },
                "is_charge_refundable": true,
                "livemode": false,
                "metadata": {},
                "payment_intent": "pi_3NydkKLkdIwHu7ix0BdxMHn3",
                "reason": "fraudulent",
                "status": "needs_response"
            }
        },
        "livemode": false,
        "pending_webhooks": 2,
        "request": {
            "id": null,
            "idempotency_key": null
        },
        "type": "charge.dispute.created"
    },
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
        const webhook = await stripeCommon.subscribeWebhook(
            'charge.dispute.created',
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