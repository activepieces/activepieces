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
        sale: {
            id: 67890,
            amount: 99.99,
            currency: "USD",
            status: "completed",
            createdAt: "2024-01-01T00:00:00+00:00",
            updatedAt: "2024-01-01T00:00:00+00:00",
            product: {
                id: 123,
                name: "Premium Course",
                type: "digital_product"
            },
            funnel: {
                id: 456,
                name: "Sales Funnel",
                step: "checkout"
            },
            contact: {
                id: 12345,
                email: "customer@example.com",
                firstName: "John",
                lastName: "Doe"
            },
            payment: {
                method: "stripe",
                transactionId: "txn_1234567890",
                gateway: "stripe"
            },
            affiliate: {
                id: null,
                commission: null
            }
        }
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
        const webhookSecret = await context.store.get<string>('new_sale_webhook_secret');
        const webhookSignatureHeader = context.payload.headers['x-webhook-signature'];
        const rawBody = context.payload.rawBody;

        if (!systemeIoCommon.verifyWebhookSignature(webhookSecret || undefined, webhookSignatureHeader, rawBody)) {
            console.warn('Systeme.io webhook signature verification failed');
            return [];
        }

        const payload = context.payload.body as any;
        return [payload.sale || payload];
    }
});
