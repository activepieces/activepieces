import { uscreenAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import {
    TriggerStrategy,
    createTrigger,
} from '@activepieces/pieces-framework';
import { uscreenCommon } from '../common/client';

export const userUpdated = createTrigger({
    name: 'user_updated',
    displayName: 'User Updated',
    description: 'Triggers when a user\'s profile or information is updated',
    auth: uscreenAuth,
    type: TriggerStrategy.WEBHOOK,
    props: {},
    sampleData: {
        id: 'user_update_123456',
        event_type: 'user.updated',
        data: {
            user_id: 'user_123456',
            email: 'user@example.com',
            first_name: 'John',
            last_name: 'Doe',
            updated_at: '2024-01-15T10:30:00Z',
            changes: {
                first_name: { from: 'Jane', to: 'John' },
                last_name: { from: 'Smith', to: 'Doe' }
            }
        }
    },
    onEnable: async (context) => {
        const { webhookUrl, auth } = context;
        const response = await uscreenCommon.apiCall({
            auth,
            method: HttpMethod.POST,
            resourceUri: '/webhooks',
            body: {
                name: 'Activepieces - User Updated',
                events: ['user.updated'],
                url: webhookUrl,
                active: true
            },
        });

        await context.store.put('webhook_id', response.body.id);
        return response.body;
    },
    onDisable: async (context) => {
        const { auth } = context;
        const webhookId = await context.store.get('webhook_id');
        if (webhookId) {
            await uscreenCommon.apiCall({
                auth,
                method: HttpMethod.DELETE,
                resourceUri: `/webhooks/${webhookId}`,
            });
        }
    },
    run: async (context) => {
        return [context.payload.body];
    },
});
