import { Property } from "@activepieces/pieces-framework";
import { HttpRequest, HttpMethod, httpClient } from "@activepieces/pieces-common";

export const jotformCommon = {
    baseUrl: 'https://api.jotform.com',
    form: Property.Dropdown({
        displayName: 'Form',
        required: true,
        refreshers: ['authentication'],
        options: async (props) => {
            if (!props['authentication']) {
                return {
                    disabled: true,
                    options: [],
                    placeholder: 'Enter API Key'
                }
            }

            try {
                const options: any[] = await jotformCommon.getUserForms(props['authentication'].toString());
                return {
                    options: options,
                    placeholder: 'Choose form to connect'
                }
            }
            catch (e) {
                console.debug(e)
                return {
                    disabled: true,
                    options: [],
                    placeholder: 'Enter API Key'
                }
            }
        }
    }),

    authentication: Property.SecretText({
        displayName: "API Key",
        required: true,
        description: "Get it from https://www.jotform.com/myaccount/api (must be full access, not read access)"
    }),

    getUserForms: async (apiKey: string) => {
        const request: HttpRequest = {
            method: HttpMethod.GET,
            url: `${jotformCommon.baseUrl}/user/forms`,
            headers: {
                APIKEY: apiKey,
            },
        };
        const response = await httpClient.sendRequest(request);

        const newValues = response.body.content.map((form: JotformForm) => {
            return {
                label: form.title,
                value: form.id
            }
        })

        return newValues;
    },

    subscribeWebhook: async (formId: any, webhookUrl: string, apiKey: string) => {
        const request: HttpRequest = {
            method: HttpMethod.POST,
            url: `${jotformCommon.baseUrl}/form/${formId}/webhooks`,
            headers: {
                APIKEY: apiKey
            },
            body: `webhookURL=${webhookUrl}`
        };

        await httpClient.sendRequest(request);
    },

    unsubscribeWebhook: async (formId: any, webhookUrl: string, apiKey: string) => {
        const getWebhooksRequest: HttpRequest = {
            method: HttpMethod.GET,
            url: `${jotformCommon.baseUrl}/form/${formId}/webhooks`,
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
            url: `${jotformCommon.baseUrl}/form/${formId}/webhooks/${webhookId}`,
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