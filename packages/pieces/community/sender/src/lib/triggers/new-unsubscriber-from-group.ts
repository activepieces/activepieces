import { HttpMethod } from "@activepieces/pieces-common";
import { createTrigger } from "@activepieces/pieces-framework";
import { TriggerStrategy } from "@activepieces/shared";
import { SenderAuth } from "../common/auth";
import { makeRequest } from "../common/client";
import { groupDropdown } from "../common/dropdown";

export const newUnsubscriberFromGroup = createTrigger({
    auth: SenderAuth,
    name: 'newUnsubscriberFromGroup',
    displayName: 'New Unsubscriber From Group',
    description: 'Triggers when a subscriber unsubscribes from a specific group',
    props: {
        groupId: groupDropdown,
    },

    sampleData: {},

    type: TriggerStrategy.WEBHOOK,

    async onEnable(context) {
        const body = {
            url: context.webhookUrl,
            events: ["subscriber.removed_from_group"],
            group_id: context.propsValue.groupId,
        };
        const response = await makeRequest(context.auth as string, HttpMethod.POST, '/webhooks', body);
        await context.store?.put('webhookId', response.id);
    },

    async onDisable(context) {
        const webhookId = await context.store?.get('webhookId');
        if (webhookId) {
            await makeRequest(context.auth as string, HttpMethod.DELETE, `/webhooks/${webhookId}`);
        }
    },

    async run(context) {
        return [context.payload.body];
    },
});
