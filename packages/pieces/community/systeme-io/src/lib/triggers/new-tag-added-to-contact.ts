import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { systemeIoAuth } from '../common/auth';
import { systemeIoCommon } from '../common/client';
import { randomBytes } from 'crypto';

export const newTagAddedToContact = createTrigger({
    auth: systemeIoAuth,
    name: 'newTagAddedToContact',
    displayName: 'New Tag Added to Contact',
    description: 'Fires when a specific tag is assigned to a contact',
    props: {},
    sampleData: {
        contact_id: '12345',
        contact_email: 'john@example.com',
        tag_id: 'tag_123',
        tag_name: 'VIP Customer',
        added_at: '2024-01-01T00:00:00Z',
        contact: {
            id: '12345',
            email: 'john@example.com',
            first_name: 'John',
            last_name: 'Doe'
        }
    },
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
        const secret = randomBytes(32).toString('hex');
        const response = await systemeIoCommon.createWebhook({
            eventType: 'CONTACT_TAG_ADDED',
            webhookUrl: context.webhookUrl,
            auth: context.auth,
            secret: secret,
        });
        
        await context.store.put('new_tag_added_webhook_id', response.id);
        await context.store.put('new_tag_added_webhook_secret', secret);
    },
    async onDisable(context) {
        const webhookId = await context.store.get<string>('new_tag_added_webhook_id');
        if (webhookId) {
            await systemeIoCommon.deleteWebhook({
                webhookId,
                auth: context.auth,
            });
            await context.store.put('new_tag_added_webhook_id', null);
            await context.store.put('new_tag_added_webhook_secret', null);
        }
    },
    async run(context) {
        return [context.payload.body];
    }
});
