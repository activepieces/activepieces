import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { stripeCommon } from '../common';
import { stripeAuth } from '../..';

export const stripeNewPaymentLink = createTrigger({
    auth: stripeAuth,
    name: 'new_payment_link',
    displayName: 'New Payment Link',
    description: 'Fires when a new Payment Link is created.',
    props: {},
    sampleData: {
        "id": "plink_1OaGDlECg9tTZuTge2B6A2bC",
        "object": "payment_link",
        "active": true,
        "after_completion": {
          "hosted_confirmation": {
            "custom_message": null
          },
          "type": "hosted_confirmation"
        },
        "allow_promotion_codes": false,
        "application": null,
        "application_fee_amount": null,
        "application_fee_percent": null,
        "automatic_tax": {
          "enabled": false,
          "liability": null
        },
        "billing_address_collection": "auto",
        "consent_collection": null,
        "created": 1702591112,
        "currency": "usd",
        "customer_creation": "if_required",
        "custom_fields": [],
        "custom_text": {
          "after_submit": null,
          "shipping_address": null,
          "submit": null,
          "terms_of_service_acceptance": null
        },
        "invoice_creation": {
          "enabled": false
        },
        "livemode": false,
        "metadata": {},
        "on_behalf_of": null,
        "payment_method_collection": "if_required",
        "payment_method_types": null,
        "phone_number_collection": {
          "enabled": false
        },
        "shipping_address_collection": null,
        "submit_type": "auto",
        "subscription_data": null,
        "tax_id_collection": {
          "enabled": false
        },
        "transfer_data": null,
        "url": "https://buy.stripe.com/test_123456789"
    },
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
        const webhook = await stripeCommon.subscribeWebhook(
            ['payment_link.created'],
            context.webhookUrl,
            context.auth
        );
        await context.store.put<WebhookInformation>('_new_payment_link_trigger', {
            webhookId: webhook.id,
        });
    },
    async onDisable(context) {
        const response = await context.store.get<WebhookInformation>(
            '_new_payment_link_trigger'
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