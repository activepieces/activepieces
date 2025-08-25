import { createTrigger, TriggerStrategy, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { mailchimpCommon } from '../common';
import { mailchimpAuth } from '../..';
import mailchimp from '@mailchimp/mailchimp_marketing';

const WEBHOOK_DATA_STORE_KEY = 'mailchimp_new_tagged_subscriber_webhook';

type WebhookData = {
    id: string; // The webhook ID from Mailchimp
    listId: string;
};

export const newTaggedSubscriberTrigger = createTrigger({
    auth: mailchimpAuth,
    name: 'new_tagged_subscriber',
    displayName: 'Subscriber Added to Tag',
    description: 'Triggers when a subscriber is added to a specific tag.',
    type: TriggerStrategy.WEBHOOK,
    props: {
        list_id: mailchimpCommon.mailChimpListIdDropdown,
        tag_id: Property.Dropdown({
            displayName: 'Tag',
            description: 'The tag to monitor for new subscribers.',
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

                const response = await (mailchimp as any).lists.tagSearch(list_id);
                const options = response.tags.map((tag: { id: number; name: string }) => ({
                    label: tag.name,
                    value: tag.id,
                }));
                return {
                    disabled: false,
                    options: options,
                };
            },
        }),
    },
    sampleData: {
        "type": "profile",
        "fired_at": "2024-08-21 10:05:00+00:00",
        "data": {
            "id": "subscriber_id_123",
            "list_id": "a6b5da1054",
            "email": "subscriber@example.com",
            "merges": {
                "FNAME": "John",
                "LNAME": "Doe"
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
            events: { profile: true }, // Profile updates fire when tags change
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
        const payloadBody = context.payload.body as { data?: { email?: string, list_id?: string } };
        if (!payloadBody?.data?.email || !payloadBody.data.list_id) {
            return [];
        }

        const targetTagId = context.propsValue.tag_id;
        const subscriberEmail = payloadBody.data.email;
        const listId = payloadBody.data.list_id;

        const accessToken = getAccessTokenOrThrow(context.auth);
        const server = await mailchimpCommon.getMailChimpServerPrefix(accessToken);
        mailchimp.setConfig({ accessToken, server });

        const subscriberHash = mailchimpCommon.getMD5EmailHash(subscriberEmail);
        const response = await (mailchimp as any).lists.getListMemberTags(listId, subscriberHash);

        const subscriberHasTag = response.tags.some((tag: { id: number }) => tag.id === targetTagId);

        if (subscriberHasTag) {
            return [payloadBody];
        }

        return [];
    },
});