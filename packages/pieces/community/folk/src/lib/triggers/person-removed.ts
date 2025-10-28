import {
    createTrigger,
    TriggerStrategy,
} from '@activepieces/pieces-framework';
import { folkAuth } from '../common/auth';
import { folkClient } from '../common/client';

export const personRemoved = createTrigger({
    auth: folkAuth,
    name: 'person_removed',
    displayName: 'Person Removed',
    description: 'Fires when a person is removed from your Folk workspace.',
    props: {},
    sampleData: {
        eventType: 'person.deleted',
        eventId: 'evt_123e4567-e89b-12d3-a456-426614174000',
        timestamp: '2025-10-28T12:00:00.000Z',
        data: {
            id: 'per_183ed5cc-3182-45de-84d1-d520f2604810',
            firstName: 'John',
            lastName: 'Doe',
            fullName: 'John Doe',
            deletedAt: '2025-10-28T12:00:00.000Z',
        }
    },
    type: TriggerStrategy.WEBHOOK,

    async onEnable(context) {
        const subscribedEvents = [{
            eventType: 'person.deleted',
        }];

        const webhook = await folkClient.createWebhook({
            apiKey: context.auth,
            name: `Activepieces Person Removed - ${Date.now()}`,
            targetUrl: context.webhookUrl,
            subscribedEvents,
        });

        await context.store?.put('_webhookId', webhook.data.id);
        await context.store?.put('_signingSecret', webhook.data.signingSecret);
    },

    async onDisable(context) {
        const webhookId = await context.store?.get('_webhookId') as string;
        if (webhookId) {
            try {
                await folkClient.deleteWebhook({
                    apiKey: context.auth,
                    webhookId,
                });
            } catch (error) {
                console.warn('Failed to delete webhook:', error);
            }
        }
    },

    async run(context) {
        const payloadBody = context.payload.body as any;
        return [payloadBody];
    },
});

