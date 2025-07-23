
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { systemeIoAuth } from '../common/auth';
import { systemeIoCommon } from '../common/client';

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
        const response = await systemeIoCommon.createWebhook({
            eventType: 'sale.completed',
            webhookUrl: context.webhookUrl,
            auth: context.auth,
        });
        
        await context.store.put('new_sale_webhook_id', response.id);
    },
    async onDisable(context) {
        const webhookId = await context.store.get<string>('new_sale_webhook_id');
        if (webhookId) {
            await systemeIoCommon.deleteWebhook({
                webhookId,
                auth: context.auth,
            });
            await context.store.put('new_sale_webhook_id', null);
        }
    },
    async run(context) {
        return [context.payload.body];
    }
});
