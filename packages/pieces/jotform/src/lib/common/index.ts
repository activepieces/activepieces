import { Property } from "@activepieces/pieces-framework";
import { HttpRequest, HttpMethod, httpClient } from "@activepieces/pieces-common";

const markdownDescription = `
To obtain api key, follow the steps below:
1. Go to Settings -> API
2. Click on "Create New Key" button
3. Change the permissions to "Full Access"
4. Copy the API Key and paste it in the API Key field
`;

export const jotformCommon = {
    baseUrl: (region: string) => {
        if (region === 'eu') {
            return 'https://eu-api.jotform.com';
        }
        return 'https://api.jotform.com';  
    },
    authentication: Property.CustomAuth({
        displayName: "Authentication",
        required: true,
        description: markdownDescription,
        props: {
            apiKey: Property.SecretText({
                displayName: 'API Key',
                required: true,
            }),
            region: Property.StaticDropdown({
                displayName: 'Region',
                required: true,
                options: {
                    options: [
                        {
                            label: 'US (jotform.com)',
                            value: 'us'
                        },
                        {
                            label: 'EU (eu.jotform.com)',
                            value: 'eu'
                        }
                    ]
                }
            })
        }
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
                    placeholder: 'Enter API Key'
                }
            }
            const auth = props['authentication'] as { apiKey: string, region: string };
            const options: any[] = await jotformCommon.getUserForms(auth.apiKey, auth.region);
            return {
                options: options,
                placeholder: 'Choose form to connect'
            }
        }
    }),
    getUserForms: async (apiKey: string, region: string) => {
        const request: HttpRequest = {
            method: HttpMethod.GET,
            url: `${jotformCommon.baseUrl(region)}/user/forms`,
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

    subscribeWebhook: async (formId: any, webhookUrl: string, authentication: {apiKey: string, region: string}) => {
        const request: HttpRequest = {
            method: HttpMethod.POST,
            url: `${jotformCommon.baseUrl(authentication.region)}/form/${formId}/webhooks`,
            headers: {
                APIKEY: authentication.apiKey,
                'Content-Type': 'multipart/form-data'
            },
            body: {
                webhookURL: webhookUrl
            },
        };

        await httpClient.sendRequest(request);
    },

    unsubscribeWebhook: async (formId: any, webhookUrl: string, authentication: {apiKey: string, region: string}) => {
        const getWebhooksRequest: HttpRequest = {
            method: HttpMethod.GET,
            url: `${jotformCommon.baseUrl(authentication.region)}/form/${formId}/webhooks`,
            headers: {
                APIKEY: authentication.apiKey,
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
            url: `${jotformCommon.baseUrl(authentication.region)}/form/${formId}/webhooks/${webhookId}`,
            headers: {
                APIKEY: authentication.apiKey
            }
        };

        const deleteResponse = await httpClient.sendRequest(request);
        return deleteResponse;
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