import { Property } from "@activepieces/pieces-framework";
import { HttpRequest, HttpMethod, httpClient } from "@activepieces/pieces-common";

export const facebookLeadsCommon = {
    baseUrl: 'https://graph.facebook.com',

    authentication: Property.OAuth2({
        displayName: 'Authentication',
        description: '',
        authUrl: "https://graph.facebook.com/oauth/authorize?",
        tokenUrl: "https://graph.facebook.com/oauth/access_token",
        required: true,
        scope: ['ads_management', 'pages_show_list', 'pages_read_engagement', 'pages_manage_ads', 'leads_retrieval', 'pages_manage_metadata'],
    }),

    form: Property.Dropdown({
        displayName: 'Form',
        required: true,
        refreshers: ['authentication'],
        options: async (props) => {
            if (!props['authentication']) {
                return {
                    disabled: true,
                    options: [],
                    placeholder: 'Connect your account'
                }
            }

            try {
                // const options: any[] = await facebookLeadsCommon.getUserForms(props['authentication'].toString());
                return {
                    // options: options,
                    options: [],
                    placeholder: 'Choose form to connect'
                }
            }
            catch (e) {
                console.debug(e)
                return {
                    disabled: true,
                    options: [],
                    placeholder: 'Connect your account'
                }
            }
        }
    }),

    subscribeAppWebhook: async (appId: string, webhookUrl: string, appAccessToken: string) => {
        const request: HttpRequest = {
            method: HttpMethod.POST,
            url: `${facebookLeadsCommon.baseUrl}/${appId}/subscriptions`,
            body: {
                object: 'page',
                callback_url: 'https://dffc-2a01-9700-1aa2-e200-5929-65fb-baf8-3f32.eu.ngrok.io',
                // callback_url: webhookUrl,
                fields: 'leadgen',
                verify_token: 'testToken123',
                access_token: appAccessToken
            }
        }

        const response = await httpClient.sendRequest(request);
        return response.body;
    },

    // subscribeWebhook: async (pageId: any, webhookUrl: string, accessToken: string) => {
    //     const request: HttpRequest = {
    //         method: HttpMethod.POST,
    //         url: `${facebookLeadsCommon.baseUrl}/${formId}/webhooks`,
    //         body: {
    //             object: 'page',
    //             callback_url: 'https://dffc-2a01-9700-1aa2-e200-5929-65fb-baf8-3f32.eu.ngrok.io',
    //             fields: 'leadgen',
    //             verify_token: 'testToken123',
    //             access_token: accessToken
    //         }
    //     }

    //     await httpClient.sendRequest(request);
    // },

    unsubscribeWebhook: async (formId: any, webhookUrl: string, apiKey: string) => {
        const getWebhooksRequest: HttpRequest = {
            method: HttpMethod.GET,
            url: `${facebookLeadsCommon.baseUrl}/form/${formId}/webhooks`,
            headers: {
                APIKEY: apiKey,
            },
        };

        const response = await httpClient.sendRequest(getWebhooksRequest);
        let webhookId;

        Object.entries(response.body.content).forEach(([key, value]) => {
            if (value == webhookUrl) {
                webhookId = key;
            }
        });

        const request: HttpRequest = {
            method: HttpMethod.DELETE,
            url: `${facebookLeadsCommon.baseUrl}/form/${formId}/webhooks/${webhookId}`,
            headers: {
                APIKEY: apiKey
            }
        };

        return await httpClient.sendRequest(request);
    }
}

export interface JotformForm {
    id: string,
    username: string,
    title: string,
    height: string,
    status: string,
    created_at: string,
    updated_at: string,
    last_submission: string,
    new: string,
    count: string,
    type: string,
    favorite: string,
    archived: string,
    url: string
}

export interface WebhookInformation {
    jotformWebhook: string;
}