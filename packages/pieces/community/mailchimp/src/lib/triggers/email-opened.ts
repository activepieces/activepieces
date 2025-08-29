import { createTrigger, TriggerStrategy, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { mailchimpCommon } from '../common';
import { mailchimpAuth } from '../..';
import mailchimp from '@mailchimp/mailchimp_marketing';

const WEBHOOK_DATA_STORE_KEY = 'mailchimp_email_opened_webhook';

type WebhookData = {
    id: string; // The webhook ID from Mailchimp
    listId: string;
};

export const emailOpenedTrigger = createTrigger({
    auth: mailchimpAuth,
    name: 'email_opened',
    displayName: 'Email Opened',
    description: 'Triggers when a recipient opens an email in a specific campaign.',
    type: TriggerStrategy.WEBHOOK,
    props: {
        list_id: mailchimpCommon.mailChimpListIdDropdown,
        campaign_id: Property.Dropdown({
            displayName: 'Campaign',
            description: 'The campaign to monitor for opens. Only sent campaigns are listed.',
            required: true,
            refreshers: ['list_id'],
            options: async ({ auth, list_id }) => {
                if (!auth || !list_id) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Please select an audience first.',
                    };
                }
                const authProp = auth as OAuth2PropertyValue;
                const accessToken = authProp.access_token;
                const serverPrefix = await mailchimpCommon.getMailChimpServerPrefix(accessToken);
                mailchimp.setConfig({ accessToken, server: serverPrefix });

                const response = await (mailchimp as any).campaigns.list({
                    list_id: list_id,
                    status: 'sent',
                });

                const options = response.campaigns.map((campaign: { id: string; settings: { title: string } }) => ({
                    label: campaign.settings.title,
                    value: campaign.id,
                }));
                return {
                    disabled: false,
                    options: options,
                };
            },
        }),
    },
    sampleData: {
        "type": "open",
        "fired_at": "2025-08-21 10:07:00+00:00",
        "data": {
            "campaign_id": "c12345",
            "list_id": "a6b5da1054",
            "email": "subscriber@example.com",
            "email_id": "unique_email_id_123",
            "ip": "123.45.67.89"
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
            events: { open: true },
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
        const payloadBody = context.payload.body as { data?: { campaign_id?: string } };

        if (!payloadBody?.data?.campaign_id) {
            return [];
        }

        const targetCampaignId = context.propsValue.campaign_id;
        const eventCampaignId = payloadBody.data.campaign_id;

        // Fire the trigger only if the open event is for the selected campaign
        if (targetCampaignId === eventCampaignId) {
            return [payloadBody];
        }

        return [];
    },
});