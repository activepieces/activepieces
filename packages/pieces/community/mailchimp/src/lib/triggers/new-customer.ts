import { createTrigger, TriggerStrategy, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { getAccessTokenOrThrow, httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { mailchimpCommon } from '../common';
import { mailchimpAuth } from '../..';
import mailchimp from '@mailchimp/mailchimp_marketing';

const WEBHOOK_DATA_STORE_KEY = 'mailchimp_new_customer_webhook';

type WebhookData = {
    id: string; // The webhook ID from Mailchimp
    storeId: string;
};

export const newCustomerTrigger = createTrigger({
    auth: mailchimpAuth,
    name: 'new_customer',
    displayName: 'New Customer',
    description: 'Triggers when a new customer is added to a connected store.',
    type: TriggerStrategy.WEBHOOK,
    props: {
        store_id: Property.Dropdown({
            displayName: 'Store',
            description: 'The e-commerce store to monitor for new customers.',
            required: true,
            refreshers: [],
            options: async ({ auth }) => {
                if (!auth) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Please connect your Mailchimp account first.',
                    };
                }
                const authProp = auth as OAuth2PropertyValue;
                const accessToken = authProp.access_token;
                const serverPrefix = await mailchimpCommon.getMailChimpServerPrefix(accessToken);
                mailchimp.setConfig({
                    accessToken: accessToken,
                    server: serverPrefix,
                });
                const response = await (mailchimp as any).ecommerce.stores();
                const options = response.stores.map((store: { id: string; name: string }) => ({
                    label: store.name,
                    value: store.id,
                }));
                return {
                    disabled: false,
                    options: options,
                };
            }
        })
    },
    sampleData: {
        "type": "customer.create",
        "fired_at": "2025-08-21T09:45:15+00:00",
        "data": {
            "id": "cust_12345",
            "email_address": "new.customer@example.com",
            "opt_in_status": true,
            "first_name": "John",
            "last_name": "Doe",
            "store_id": "store_abc"
        }
    },

    async onEnable(context): Promise<void> {
        const accessToken = getAccessTokenOrThrow(context.auth);
        const server = await mailchimpCommon.getMailChimpServerPrefix(accessToken);
        const storeId = context.propsValue.store_id!;

        const response = await httpClient.sendRequest<{ id: string }>({
            method: HttpMethod.POST,
            url: `https://${server}.api.mailchimp.com/3.0/ecommerce/stores/${storeId}/webhooks`,
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: accessToken,
            },
            body: {
                url: context.webhookUrl,
                events: ['customer.create'],
            },
        });

        await context.store.put<WebhookData>(WEBHOOK_DATA_STORE_KEY, {
            id: response.body.id,
            storeId: storeId,
        });
    },

    async onDisable(context): Promise<void> {
        const webhookData = await context.store.get<WebhookData>(WEBHOOK_DATA_STORE_KEY);
        if (webhookData != null) {
            const token = getAccessTokenOrThrow(context.auth);
            const server = await mailchimpCommon.getMailChimpServerPrefix(token);
            await httpClient.sendRequest({
                method: HttpMethod.DELETE,
                url: `https://${server}.api.mailchimp.com/3.0/ecommerce/stores/${webhookData.storeId}/webhooks/${webhookData.id}`,
                authentication: {
                    type: AuthenticationType.BEARER_TOKEN,
                    token,
                },
            });
        }
    },

    async run(context): Promise<unknown[]> {
        const payloadBody = context.payload.body;
        if (!payloadBody || typeof payloadBody !== 'object') {
            return [];
        }
        return [payloadBody];
    },
});