import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { autocallsAuth, baseApiUrl } from '../..';

export const inboundCall = createTrigger({
    auth:autocallsAuth,
    name: 'inboundCall',
    displayName: 'Inbound Call',
    description: 'Triggers for variables before connecting an inbound call.',
    props: {
        assistant: Property.Dropdown({
            displayName: 'Assistant',
            description: 'Select an assistant',
            required: true,
            refreshers: ['auth'],
            refreshOnSearch: false,
            options: async ({ auth }) => {
                const res = await httpClient.sendRequest({
                    method: HttpMethod.GET,
                    url: baseApiUrl + 'api/user/assistants',
                    headers: {
                        Authorization: "Bearer " + auth,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                });

                if (res.status !== 200) {
                    return {
                        disabled: true,
                        placeholder: 'Error fetching assistants',
                        options: [],
                    };
                } else if (res.body.length === 0) {
                    return {
                        disabled: true,
                        placeholder: 'No assistants found. Create one first.',
                        options: [],
                    };
                }

                return {
                    options: res.body.map((assistant: any) => ({
                        value: assistant.id,
                        label: assistant.name,
                    })),
                };
            }
        }),
    },
    sampleData: {
        customer_phone: '+16380991171',
        assistant_phone: '+16380991171',
    },
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
        await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: baseApiUrl + 'api/user/assistants/enable-inbound-webhook',
            body: {
                assistant_id: context.propsValue['assistant'],
                webhook_url: context.webhookUrl,
            },
            headers: {
                Authorization: "Bearer " + context.auth,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
        });
    },
    async onDisable(context) {
        await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: baseApiUrl + 'api/user/assistants/disable-inbound-webhook',
            body: {
                assistant_id: context.propsValue['assistant'],
            },
            headers: {
                Authorization: "Bearer " + context.auth,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
        });
    },
    async run(context) {
        return [context.payload.body]
    }
})
