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
        contact: {
            id: 12345,
            email: "email@example.com",
            registeredAt: "2024-01-01T00:00:00+00:00",
            locale: "en",
            sourceURL: null,
            unsubscribed: false,
            bounced: false,
            needsConfirmation: false,
            fields: [
                {
                    fieldName: "first_name",
                    slug: "first_name",
                    value: "John"
                },
                {
                    fieldName: "last_name",
                    slug: "last_name",
                    value: "Doe"
                },
                {
                    fieldName: "phone_number",
                    slug: "phone_number",
                    value: "+1234567890"
                }
            ],
            tags: [
                {
                    id: 1,
                    name: "new_customer"
                },
                {
                    id: 2,
                    name: "email_subscriber"
                }
            ]
        }
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
        const webhookSecret = await context.store.get<string>('new_contact_webhook_secret');
        const webhookSignatureHeader = context.payload.headers['x-webhook-signature'];
        const rawBody = context.payload.rawBody;

        if (!systemeIoCommon.verifyWebhookSignature(webhookSecret || undefined, webhookSignatureHeader, rawBody)) {
            console.warn('Systeme.io webhook signature verification failed');
            return [];
        }

        const payload = context.payload.body as any;
        return [payload.contact || payload];
    }
});
