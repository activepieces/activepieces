import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { mailchimpCommon } from '../common';
import { mailchimpAuth } from '../..';

const WEBHOOK_DATA_STORE_KEY = 'mailchimp_link_clicked_webhook';

type WebhookData = {
    id: string; // The webhook ID from Mailchimp
    listId: string;
};

export const linkClickedTrigger = createTrigger({
    auth: mailchimpAuth,
    name: 'link_clicked',
    displayName: 'Link Clicked',
    description: 'Triggers when a recipient clicks a link in a campaign.',
    type: TriggerStrategy.WEBHOOK,
    props: {
        list_id: mailchimpCommon.mailChimpListIdDropdown,
    },
    sampleData: {
        "type": "click",
        "fired_at": "2024-08-21 10:35:00+00:00",
        "data": {
            "campaign_id": "c12345",
            "list_id": "a6b5da1054",
            "email": "subscriber@example.com",
            "email_id": "unique_email_id_123",
            "url": "https://www.example.com/summer-sale",
            "ip": "123.45.67.89",
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
            events: { click: true }, // Subscribe to click events
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