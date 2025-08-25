import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { mailchimpCommon } from '../common';
import { mailchimpAuth } from '../..';

// Webhooks are tied to a specific audience in Mailchimp
const WEBHOOK_DATA_STORE_KEY = 'mailchimp_new_campaign_webhook';

type WebhookData = {
    id: string; // The webhook ID from Mailchimp
    listId: string;
};

export const newCampaignTrigger = createTrigger({
    auth: mailchimpAuth,
    name: 'new_campaign',
    displayName: 'New or Sent Campaign',
    description: 'Triggers when a campaign is created or sent.',
    type: TriggerStrategy.WEBHOOK,
    props: {
        list_id: mailchimpCommon.mailChimpListIdDropdown,
    },
    sampleData: {
        "fired_at": "2024-08-21T10:30:00+00:00",
        "data": {
            "id": "c12345",
            "subject": "Our Summer Sale Starts Now!",
            "status": "sent",
            "list_id": "a6b5da1054"
        },
        "type": "campaign"
    },

    async onEnable(context): Promise<void> {
        const accessToken = getAccessTokenOrThrow(context.auth);
        const server = await mailchimpCommon.getMailChimpServerPrefix(accessToken);

        const webhookId = await mailchimpCommon.enableWebhookRequest({
            server,
            listId: context.propsValue.list_id!,
            token: accessToken,
            webhookUrl: context.webhookUrl,
            events: { campaign: true }, // Subscribe to campaign events
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
        // The webhook payload is the entire body
        const payloadBody = context.payload.body;
        // Mailchimp sends a GET request to verify the webhook URL, which we should ignore.
        if (!payloadBody || typeof payloadBody !== 'object') {
            return [];
        }
        return [payloadBody];
    },
});