import { uscreenAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import {
    TriggerStrategy,
    createTrigger,
} from '@activepieces/pieces-framework';
import { uscreenCommon } from '../common/client';

export const newUser = createTrigger({
    name: 'new_user',
    displayName: 'New User',
    description: 'Triggers when a new user is added to your storefront',
    auth: uscreenAuth,
    type: TriggerStrategy.WEBHOOK,
    props: {},
    sampleData: {
        id: 'user_123456',
        event_type: 'user.created',
        data: {
            user_id: 'user_123456',
            email: 'user@example.com',
            first_name: 'John',
            last_name: 'Doe',
            created_at: '2024-01-15T10:30:00Z',
            updated_at: '2024-01-15T10:30:00Z',
            status: 'active',
            subscription_status: 'none'
        }
    },
    onEnable: async (context) => {
        const { webhookUrl, auth } = context;
        const response = await uscreenCommon.apiCall({
            auth,
            method: HttpMethod.POST,
            resourceUri: '/webhooks',
            body: {
                name: 'Activepieces - New User',
                events: ['user.created'],
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
