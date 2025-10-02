import { HttpMethod } from "@activepieces/pieces-common";
import { createTrigger } from "@activepieces/pieces-framework";
import { TriggerStrategy } from "@activepieces/shared";
import { SenderAuth } from "../common/auth";
import { makeRequest } from "../common/client";

export const newSubscriber = createTrigger({
    auth: SenderAuth,
    name: 'newSubscriber',
    displayName: 'New Subscriber',
    description: 'Triggers when a new subscriber is added',
    props: {},

    sampleData: {
        id: "sub_123",
        email: "john.doe@example.com",
        first_name: "John",
        last_name: "Doe",
        phone: "+1234567890",
        groups: ["b2vAR1"],
        created: "2023-09-01 11:00:00",
        updated: "2023-09-01 11:00:00"
    },

    type: TriggerStrategy.WEBHOOK,

    async onEnable(context) {
        const body = {
            url: context.webhookUrl,
            topic: 'subscribers/new',
        };
        const response = await makeRequest(context.auth as string, HttpMethod.POST, '/account/webhooks', body);
        await context.store?.put('webhookId', response.id);
    },

    async onDisable(context) {
        const webhookId = await context.store?.get('webhookId');
        if (webhookId) {
            await makeRequest(context.auth as string, HttpMethod.DELETE, `/account/webhooks/${webhookId}`);
        }
    },

    async run(context) {
        return [context.payload.body];
    },
});
