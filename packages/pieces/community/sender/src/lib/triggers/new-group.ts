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
    sampleData: {},
    type: TriggerStrategy.WEBHOOK,

    async onEnable(context) {
        const body = {
            url: context.webhookUrl,
            events: ['group.created'],
        };

        const response = await makeRequest(
            context.auth as string,
            HttpMethod.POST,
            '/webhooks',
            body
        );

        await context.store?.put('webhookId', response.body.data.id);
    },

    async onDisable(context) {
        const webhookId = await context.store?.get<string>('webhookId');
        if (webhookId) {
            await makeRequest(
                context.auth as string,
                HttpMethod.DELETE,
                `/webhooks/${webhookId}`
            );
        }
        await context.store?.delete('webhookId');
    },

    async run(context) {
        return [context.payload.body];
    },

    async test(context) {
        const response = await makeRequest(
            context.auth as string,
            HttpMethod.GET,
            '/groups?limit=1'
        );
        const groups = response?.data ?? response?.body?.data ?? [];

        return Array.isArray(groups) ? groups : [groups];
    },
});
