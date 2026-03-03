import {logsnagAuth} from "../../";
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';

// since LogSnag doesn't expose an endpoint to GET data 
// by polling or an endpoint to register webhooks,
// this sample uses a fictional endpoint URL 
// in order to demonstrate how it could work in theory
// using a webhook

export const newEventCreated = createTrigger({
    auth: logsnagAuth,
    name: 'newEventCreated',
    displayName: 'New event created',
    description: 'triggers when a new event ic created and logged',
    props: {
        project: Property.ShortText({displayName: "Project", required: true}),
        channel: Property.ShortText({displayName: "Channel", required: true}),
        event:  Property.ShortText({displayName: "Event", required: true}),
    },
    sampleData: {
        project: "MyProject",
        channel: "MyChannel",
        event: "TestEvent",
    },
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: "https://api.logsnag.com/v1/webhooks", // <-- fictional LogSnag API endpoint,
            headers: {
            Authorization: `Bearer ${context.auth.secret_text}`,
            'Content-Type': 'application/json',
            },
            body: {
                event: 'event.created',
                target: context.webhookUrl,
                project: context.propsValue.project,
                channel: context.propsValue.channel,
            },
        });

        if (response.status === 200 || response.status === 201) {
            const webhook = response.body as { uuid: string };
            await context.store.put('_logsnag_webhook', webhook.uuid);
        }
    },
    async onDisable(context) {
        const webhookId = await context.store.get<string>('_logsnag_webhook');
        if (webhookId) {
            await httpClient.sendRequest({
            method: HttpMethod.DELETE,
            url: `https://api.logsnag.com/v1/webhooks/${webhookId}/`,
            headers: {
                Authorization: `Bearer ${context.auth.secret_text}`,
                'Content-Type': 'application/json',
            },
            });
            await context.store.delete('_logsnag_webhook');
        }
    },
    async run(context){
        const payload = context.payload.body;
        return [payload]; 
    }
})