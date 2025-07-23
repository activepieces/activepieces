
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { systemeIoAuth } from '../common/auth';
import { systemeIoCommon } from '../common/client';
import { randomBytes } from 'crypto';

export const newSale = createTrigger({
    auth: systemeIoAuth,
    name: 'newSale',
    displayName: 'New Sale',
    description: 'Fires when a new purchase is made within a funnel',
    props: {},
    sampleData: {
        id: '67890',
        contact_id: '12345',
        contact_email: 'john@example.com',
        amount: 99.99,
        currency: 'USD',
        product_name: 'Premium Course',
        funnel_name: 'Sales Funnel',
        created_at: '2024-01-01T00:00:00Z',
        status: 'completed'
    },
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
        const secret = randomBytes(32).toString('hex');
        const response = await systemeIoCommon.createWebhook({
            eventType: 'SALE_NEW',
            webhookUrl: context.webhookUrl,
            auth: context.auth,
            secret: secret,
        });
        
        await context.store.put('new_sale_webhook_id', response.id);
        await context.store.put('new_sale_webhook_secret', secret);
    },
    async onDisable(context) {
        const webhookId = await context.store.get<string>('new_sale_webhook_id');
        if (webhookId) {
            await systemeIoCommon.deleteWebhook({
                webhookId,
                auth: context.auth,
            });
            await context.store.put('new_sale_webhook_id', null);
            await context.store.put('new_sale_webhook_secret', null);
        }
    },
    async run(context) {
        return [context.payload.body];
    }
});
