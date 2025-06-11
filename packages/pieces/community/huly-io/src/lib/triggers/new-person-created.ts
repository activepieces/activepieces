import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { createClient } from '../common/client';
import { hulyIoAuth } from '../../index';

const markdown = `
To set up the Huly.io WebSocket trigger for new person creation:

1. This trigger uses Huly.io's WebSocket API to register for real-time events.
2. When enabled, Activepieces will automatically register to receive notifications when new people are created.
3. Person information will be delivered to your flow in real-time.
4. No additional webhook configuration is needed in your Huly.io account.
`;

export const newPersonCreated = createTrigger({
    auth: hulyIoAuth,
    name: 'new_person_created',
    displayName: 'New Person Created',
    description: 'Triggered when a new person is created in Huly.io',
    props: {
        md: Property.MarkDown({
            value: markdown,
        }),
    },
    type: TriggerStrategy.WEBHOOK,
    sampleData: {
        id: 'person_123',
        firstName: 'John',
        lastName: 'Doe',
        channels: [
            {
                type: 'email',
                value: 'john.doe@example.com'
            }
        ],
        createdAt: '2023-09-12T14:30:00Z'
    },
    async onEnable(context) {
        const client = createClient(context.auth);

        try {
            // Register for person creation events
            await client.request('POST', '/webhooks/register', {
                url: context.webhookUrl,
                events: ['person.created']
            });
        } catch (error) {
            console.error('Failed to register webhook:', error);
        } finally {
            await client.disconnect();
        }
    },
    async onDisable(context) {
        const client = createClient(context.auth);

        try {
            // Unregister from person creation events
            await client.request('POST', '/webhooks/unregister', {
                url: context.webhookUrl
            });
        } catch (error) {
            console.error('Failed to unregister webhook:', error);
        } finally {
            await client.disconnect();
        }
    },
    async run(context) {
        return [context.payload];
    },
});
