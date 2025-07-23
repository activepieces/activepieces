
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { systemeIoAuth } from '../common/auth';
import { systemeIoCommon } from '../common/client';
import { randomBytes } from 'crypto';

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
        const secret = randomBytes(32).toString('hex');
        const response = await systemeIoCommon.createWebhook({
            eventType: 'CONTACT_CREATED',
            webhookUrl: context.webhookUrl,
            auth: context.auth,
            secret: secret,
        });
        
        await context.store.put('new_contact_webhook_id', response.id);
        await context.store.put('new_contact_webhook_secret', secret);
    },
    async onDisable(context) {
        const webhookId = await context.store.get<string>('new_contact_webhook_id');
        if (webhookId) {
            await systemeIoCommon.deleteWebhook({
                webhookId,
                auth: context.auth,
            });
            await context.store.put('new_contact_webhook_id', null);
            await context.store.put('new_contact_webhook_secret', null);
        }
    },
    async run(context) {
        return [context.payload.body];
    }
});
