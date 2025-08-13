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
        contact: {
            id: 12345,
            email: "customer@example.com",
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
                    name: "existing_customer"
                },
                {
                    id: 2,
                    name: "VIP Customer"
                }
            ]
        },
        tag: {
            id: 2,
            name: "VIP Customer"
        },
        addedAt: "2024-01-01T10:30:00+00:00"
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
        const webhookSecret = await context.store.get<string>('new_tag_added_webhook_secret');
        const webhookSignatureHeader = context.payload.headers['x-webhook-signature'];
        const rawBody = context.payload.rawBody;

        if (!systemeIoCommon.verifyWebhookSignature(webhookSecret || undefined, webhookSignatureHeader, rawBody)) {
            console.warn('Systeme.io webhook signature verification failed');
            return [];
        }

        const payload = context.payload.body as any;
        return [payload];
    }
});
