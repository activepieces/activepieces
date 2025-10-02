import { HttpMethod } from "@activepieces/pieces-common";
import { createTrigger } from "@activepieces/pieces-framework";
import { TriggerStrategy } from "@activepieces/shared";
import { SenderAuth } from "../common/auth";
import { makeRequest } from "../common/client";

export const newUnsubscriber = createTrigger({
    auth: SenderAuth,
    name: 'newUnsubscriber',
    displayName: 'New Unsubscriber',
    description: 'Triggers when a subscriber unsubscribes globally',
    props: {},

    sampleData: {
        subscriber_id: "sub_123",
        email: "john.doe@example.com",
        unsubscribed_at: "2023-09-01 13:00:00",
        reason: "User requested"
    },

    type: TriggerStrategy.WEBHOOK,

    async onEnable(context) {
        const body = {
            url: context.webhookUrl,
            topic: 'subscribers/unsubscribed'
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
