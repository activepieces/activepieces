import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { famulorAuth, baseApiUrl } from '../..';

export const phoneCallEnded = createTrigger({
    auth:famulorAuth,
    name: 'phoneCallEnded',
    displayName: 'Phone Call Ended',
    description: 'Triggers when a phone call ends, with extracted variables.',
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
                    options: res.body.map((assistant: {id:number,name:string}) => ({
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
        duration: 120,
        status: 'completed',
        extracted_variables: {
            status: false,
            summary: 'Call ended without clear objective being met.'
        },
        input_variables: {
            customer_name: 'John'
        },
        transcript: [
            {
                sender: 'bot',
                timestamp: 1722347063.574402,
                text: 'Hi! How are you, John?'
            },
            {
                sender: 'human',
                timestamp: 1722347068.886166,
                text: 'Im fine. How about you?'
            },
            {
                sender: 'bot',
                timestamp: 1722347069.76683,
                text: 'Im doing well, thank you for asking.'
            },
            {
                sender: 'bot',
                timestamp: 1722347071.577889,
                text: 'How can I assist you today?'
            },
        ]
    },
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
        await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: baseApiUrl + 'api/user/assistants/enable-webhook',
            body: {
                assistant_id: context.propsValue['assistant'],
                webhook_url: context.webhookUrl,
            },
            headers: {
                Authorization: "Bearer " + context.auth,
            },
        });
    },
    async onDisable(context) {
        await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: baseApiUrl + 'api/user/assistants/disable-webhook',
            body: {
                assistant_id: context.propsValue['assistant'],
            },
            headers: {
                Authorization: "Bearer " + context.auth,
            },
        });
    },
    async run(context) {
        return [context.payload.body]
    }
})