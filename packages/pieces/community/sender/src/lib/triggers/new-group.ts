import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { SenderAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const newGroup = createTrigger({
    auth: SenderAuth,
    name: 'newGroup',
    displayName: 'New Group',
    description: 'Triggers when a new group/list is created in Sender',
    props: {},

    sampleData: {
        id: "b2vAR1",
        name: "VIP Subscribers",
        description: "Group for VIP customers",
        created: "2023-09-01 10:00:00",
        modified: "2023-09-01 10:00:00",
        subscriber_count: 15
    },

    type: TriggerStrategy.WEBHOOK,

    async onEnable(context) {
        const body = {
            url: context.webhookUrl,
            topic: 'groups/new',
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
