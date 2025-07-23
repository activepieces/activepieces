
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { systemeIoAuth } from '../common/auth';
import { systemeIoCommon } from '../common/client';

export const newContact = createTrigger({
    auth: systemeIoAuth,
    name: 'newContact',
    displayName: 'New Contact',
    description: 'Fires when a new contact is created',
    props: {},
    sampleData: {
        id: '12345',
        email: 'john@example.com',
        first_name: 'John',
        last_name: 'Doe',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        tags: [],
        fields: [
            {
                slug: 'phone',
                value: '+1234567890'
            }
        ]
    },
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
        const response = await systemeIoCommon.createWebhook({
            eventType: 'contact.created',
            webhookUrl: context.webhookUrl,
            auth: context.auth,
        });
        
        await context.store.put('new_contact_webhook_id', response.id);
    },
    async onDisable(context) {
        const webhookId = await context.store.get<string>('new_contact_webhook_id');
        if (webhookId) {
            await systemeIoCommon.deleteWebhook({
                webhookId,
                auth: context.auth,
            });
            await context.store.put('new_contact_webhook_id', null);
        }
    },
    async run(context) {
        return [context.payload.body];
    }
});
