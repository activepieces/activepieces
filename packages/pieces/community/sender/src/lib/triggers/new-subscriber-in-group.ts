import { HttpMethod } from "@activepieces/pieces-common";
import { createTrigger } from "@activepieces/pieces-framework";
import { TriggerStrategy } from "@activepieces/shared";
import { SenderAuth } from "../common/auth";
import { makeRequest } from "../common/client";

export const newSubscriberInGroup = createTrigger({
    auth: SenderAuth,
    name: 'newSubscriberInGroup',
    displayName: 'New Subscriber in Group',
    description: 'Triggers when a new subscriber is added to a specific group',
    props: {},

    sampleData: {
        subscriber_id: "sub_123",
        email: "john.doe@example.com",
        group_id: "b2vAR1",
        group_name: "VIP Subscribers",
        created: "2023-09-01 11:05:00"
    },

    type: TriggerStrategy.WEBHOOK,

    async onEnable(context) {
        const body = {
            url: context.webhookUrl,
            topic: 'groups/new-subscriber',
            relation_id: "eZVD4w"
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
