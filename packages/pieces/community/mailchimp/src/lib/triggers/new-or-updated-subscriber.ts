import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { mailchimpCommon } from '../common';
import { mailchimpAuth } from '../..';

const WEBHOOK_DATA_STORE_KEY = 'mailchimp_new_or_updated_subscriber_webhook';

type WebhookData = {
    id: string; // The webhook ID from Mailchimp
    listId: string;
};

export const newOrUpdatedSubscriberTrigger = createTrigger({
    auth: mailchimpAuth,
    name: 'new_or_updated_subscriber',
    displayName: 'New or Updated Subscriber',
    description: 'Triggers when a new subscriber is added to an audience or an existing one is updated.',
    type: TriggerStrategy.WEBHOOK,
    props: {
        list_id: mailchimpCommon.mailChimpListIdDropdown,
    },
    sampleData: {
        "type": "subscribe",
        "fired_at": "2025-08-21 10:01:22+00:00",
        "data": {
            "id": "8a25ff1d98",
            "list_id": "a6b5da1054",
            "email": "api@mailchimp.com",
            "email_type": "html",
            "merges": {
                "EMAIL": "api@mailchimp.com",
                "FNAME": "Mailchimp",
                "LNAME": "API"
            }
        }
    },

    async onEnable(context): Promise<void> {
        const accessToken = getAccessTokenOrThrow(context.auth);
        const server = await mailchimpCommon.getMailChimpServerPrefix(accessToken);

        const webhookId = await mailchimpCommon.enableWebhookRequest({
            server,
            listId: context.propsValue.list_id!,
            token: accessToken,
            webhookUrl: context.webhookUrl,
            // Subscribe to both new subscriptions and profile updates
            events: { subscribe: true, profile: true },
        });

        await context.store.put<WebhookData>(WEBHOOK_DATA_STORE_KEY, {
            id: webhookId,
            listId: context.propsValue.list_id!,
        });
    },

    async onDisable(context): Promise<void> {
        const webhookData = await context.store.get<WebhookData>(WEBHOOK_DATA_STORE_KEY);
        if (webhookData != null) {
            const token = getAccessTokenOrThrow(context.auth);
            const server = await mailchimpCommon.getMailChimpServerPrefix(token);
            await mailchimpCommon.disableWebhookRequest({
                server,
                token,
                listId: webhookData.listId,
                webhookId: webhookData.id,
            });
        }
    },

    async run(context): Promise<unknown[]> {
        const payloadBody = context.payload.body;

        // This type guard handles the initial webhook verification from Mailchimp
        // and ensures the payload is a valid object.
        if (!payloadBody || typeof payloadBody !== 'object') {
            return [];
        }

        return [payloadBody];
    },
});