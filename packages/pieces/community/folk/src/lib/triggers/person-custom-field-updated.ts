import {
    createTrigger,
    TriggerStrategy,
} from '@activepieces/pieces-framework';
import { folkAuth } from '../common/auth';
import { folkClient } from '../common/client';

export const personCustomFieldUpdated = createTrigger({
    auth: folkAuth,
    name: 'person_custom_field_updated',
    displayName: 'Person Groups Updated',
    description: 'Fires when a person\'s group assignments are updated in your Folk workspace.',
    props: {},
    sampleData: {
        eventType: 'person.groups_updated',
        eventId: 'evt_123e4567-e89b-12d3-a456-426614174000',
        timestamp: '2025-10-28T12:00:00.000Z',
        data: {
            id: 'per_183ed5cc-3182-45de-84d1-d520f2604810',
            firstName: 'John',
            lastName: 'Doe',
            fullName: 'John Doe',
            groups: [
                {
                    id: 'grp_5fa60242-0756-4e31-8cca-30c2c5ff1ac2',
                    name: 'Engineering'
                },
                {
                    id: 'grp_new123-4567-89ab-cdef-123456789abc',
                    name: 'Management'
                }
            ],
            customFieldValues: {
                'grp_5fa60242-0756-4e31-8cca-30c2c5ff1ac2': {
                    'Status': 'Active',
                    'Programming languages': ['Javascript', 'Python'],
                    'Join date': '2021-01-01'
                }
            }
        }
    },
    type: TriggerStrategy.WEBHOOK,

    async onEnable(context) {
        const subscribedEvents = [{
            eventType: 'person.groups_updated',
        }];

        const webhook = await folkClient.createWebhook({
            apiKey: context.auth,
            name: `Activepieces Person Groups Updated - ${Date.now()}`,
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

