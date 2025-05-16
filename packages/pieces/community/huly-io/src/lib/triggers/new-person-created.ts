import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { createClient } from '../common/client';

const markdown = `
To set up the Huly.io webhook trigger for new person creation:

1. You'll need to configure a webhook in your Huly.io account to send notifications to Activepieces when a new person is created.
2. Copy the webhook URL from below and add it to your Huly.io webhooks configuration.
3. Set the event type to "person.created" when configuring the webhook.
4. Activepieces will start receiving notifications when new people are created in your Huly.io account.

Note: In a production environment, we would use the @hcengineering/api-client package to automatically register for real-time events.
`;

export const newPersonCreated = createTrigger({
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
        // In a real implementation with @hcengineering/api-client:
        // const client = createClient(context.auth);
        // await client.request('POST', '/webhooks/register', {
        //     url: context.webhookUrl,
        //     events: ['person.created']
        // });
    },
    async onDisable(context) {
        // In a real implementation with @hcengineering/api-client:
        // const client = createClient(context.auth);
        // await client.request('POST', '/webhooks/unregister', {
        //     url: context.webhookUrl
        // });
    },
    async run(context) {
        return [context.payload];
    },
});
