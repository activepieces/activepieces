import {
    createTrigger,
    TriggerStrategy,
} from '@activepieces/pieces-framework';
import { folkAuth } from '../common/auth';
import { folkClient } from '../common/client';

export const companyCustomFieldUpdated = createTrigger({
    auth: folkAuth,
    name: 'company_custom_field_updated',
    displayName: 'Company Groups Updated',
    description: 'Fires when a company\'s group assignments are updated in your Folk workspace.',
    props: {},
    sampleData: {
        eventType: 'company.groups_updated',
        eventId: 'evt_123e4567-e89b-12d3-a456-426614174000',
        timestamp: '2025-10-28T12:00:00.000Z',
        data: {
            id: 'com_92346499-30bf-4278-ae8e-4aa3ae2ace2c',
            name: 'Tech Corp',
            groups: [
                {
                    id: 'grp_5fa60242-0756-4e31-8cca-30c2c5ff1ac2',
                    name: 'Technology'
                },
                {
                    id: 'grp_new123-4567-89ab-cdef-123456789abc',
                    name: 'Enterprise'
                }
            ],
            customFieldValues: {
                'grp_5fa60242-0756-4e31-8cca-30c2c5ff1ac2': {
                    'Industry': 'Technology',
                    'Size': 'Large',
                    'Founded': '2010'
                }
            }
        }
    },
    type: TriggerStrategy.WEBHOOK,

    async onEnable(context) {
        const subscribedEvents = [{
            eventType: 'company.groups_updated',
        }];

        const webhook = await folkClient.createWebhook({
            apiKey: context.auth,
            name: `Activepieces Company Groups Updated - ${Date.now()}`,
            targetUrl: context.webhookUrl,
            subscribedEvents,
        });

        await context.store?.put('_webhookId', webhook.data.id);
        // await context.store?.put('_signingSecret', webhook.data.signingSecret);
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

