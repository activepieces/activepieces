import { HttpMethod } from "@activepieces/pieces-common";
import { createTrigger } from "@activepieces/pieces-framework";
import { TriggerStrategy } from "@activepieces/shared";
import { SenderAuth } from "../common/auth";
import { makeRequest } from "../common/client";

export const updatedSubscriber = createTrigger({
    auth: SenderAuth,
    name: 'updatedSubscriber',
    displayName: 'Updated Subscriber',
    description: 'Triggers when a subscriber data is updated',
    props: {},

    sampleData: {
        subscriber_id: "sub_123",
        email: "john.doe@example.com",
        first_name: "Johnathan",
        last_name: "Doe",
        phone: "+1234567890",
        groups: ["b2vAR1"],
        updated: "2023-09-01 12:00:00"
    },

    type: TriggerStrategy.WEBHOOK,

    async onEnable(context) {
        const body = {
            url: context.webhookUrl,
            topic: 'subscribers/updated'
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
