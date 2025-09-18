
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { stripeAuth } from '../../';
import { stripeCommon } from '../common';
export const checkoutSessionCompleted = createTrigger({
    auth: stripeAuth,
    name: 'checkoutSessionCompleted',
    displayName: 'Checkout Session Completed',
    description: 'Triggers when a Stripe Checkout Session is successfully completed.',
    props: {},
    sampleData: {
        "id": "evt_1NyiAzLkdIwHu7ixPr7FzQtG",
        "object": "event",
        "api_version": "2023-10-16",
        "created": 1697715000,
        "data": {
            "object": {
                "id": "cs_test_a1ABcDe2fGHijKlmN3OPqRStuvwXYZ4Abc5Defg6HIjKlMNO",
                "object": "checkout.session",
                "after_expiration": null,
                "allow_promotion_codes": false,
                "amount_subtotal": 3500,
                "amount_total": 3500,
                "automatic_tax": {
                    "enabled": false,
                    "status": null
                },
                "billing_address_collection": "auto",
                "cancel_url": "https://example.com/cancel",
                "client_reference_id": "order_123456",
                "consent": null,
                "consent_collection": null,
                "created": 1697714950,
                "currency": "usd",
                "custom_fields": [
                    {
                        "key": "gift_note",
                        "label": {
                            "custom": "Gift message",
                            "type": "custom"
                        },
                        "optional": true,
                        "type": "text",
                        "value": "Happy Birthday!"
                    }
                ],
                "custom_text": {
                    "shipping_address": null,
                    "submit": null,
                    "terms_of_service_acceptance": null
                },
                "customer": "cus_PKLUCiWEVgc2fN",
                "customer_creation": "if_required",
                "customer_details": {
                    "address": {
                        "city": "San Francisco",
                        "country": "US",
                        "line1": "123 Market St",
                        "line2": "#456",
                        "postal_code": "94107",
                        "state": "CA"
                    },
                    "email": "customer@example.com",
                    "name": "Jenny Rosen",
                    "phone": "+15551234567",
                    "tax_exempt": "none",
                    "tax_ids": []
                },
                "customer_email": "customer@example.com",
                "expires_at": 1697801350,
                "invoice": null,
                "invoice_creation": {
                    "enabled": false,
                    "invoice_data": {
                        "account_tax_ids": null,
                        "custom_fields": null,
                        "description": null,
                        "footer": null,
                        "metadata": {},
                        "rendering_options": null
                    }
                },
                "livemode": false,
                "locale": null,
                "metadata": {
                    "order_id": "order_123456"
                },
                "mode": "payment",
                "payment_intent": "pi_3NyiAuLkdIwHu7ix0MbeD6WR",
                "payment_link": null,
                "payment_method_collection": "always",
                "payment_method_options": {},
                "payment_method_types": ["card"],
                "payment_status": "paid",
                "phone_number_collection": {
                    "enabled": true
                },
                "recovered_from": null,
                "setup_intent": null,
                "shipping_address_collection": {
                    "allowed_countries": ["US", "CA"]
                },
                "shipping_cost": {
                    "amount_subtotal": 500,
                    "amount_tax": 0,
                    "amount_total": 500,
                    "shipping_rate": "shr_1NyiAjLkdIwHu7ixAK3Qetyh"
                },
                "shipping_details": {
                    "address": {
                        "city": "San Francisco",
                        "country": "US",
                        "line1": "123 Market St",
                        "line2": "#456",
                        "postal_code": "94107",
                        "state": "CA"
                    },
                    "name": "Jenny Rosen",
                    "phone": null
                },
                "shipping_options": [
                    {
                        "shipping_amount": 500,
                        "shipping_rate": "shr_1NyiAjLkdIwHu7ixAK3Qetyh"
                    }
                ],
                "status": "complete",
                "submit_type": "pay",
                "subscription": null,
                "success_url": "https://example.com/success?session_id={CHECKOUT_SESSION_ID}",
                "total_details": {
                    "amount_discount": 0,
                    "amount_shipping": 500,
                    "amount_tax": 0
                },
                "url": null
            }
        },
        "livemode": false,
        "pending_webhooks": 2,
        "request": {
            "id": null,
            "idempotency_key": null
        },
        "type": "checkout.session.completed"
    },
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
        const webhook = await stripeCommon.subscribeWebhook(
            'checkout.session.completed',
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