import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { createClient } from '../common/client';
import { hulyIoAuth } from '../../index';

const markdown = `
To set up the Huly.io WebSocket trigger for new issue creation:

1. This trigger uses Huly.io's WebSocket API to register for real-time events.
2. When enabled, Activepieces will automatically register to receive notifications when new issues are created.
3. Issues will be delivered to your flow in real-time.
4. No additional webhook configuration is needed in your Huly.io account.
`;

export const newIssueCreated = createTrigger({
    auth: hulyIoAuth,
    name: 'new_issue_created',
    displayName: 'New Issue Created',
    description: 'Triggered when a new issue is created in Huly.io',
    props: {
        md: Property.MarkDown({
            value: markdown,
        }),
    },
    type: TriggerStrategy.WEBHOOK,
    sampleData: {
        id: 'issue_456',
        title: 'Implement new feature',
        description: 'We need to implement the new feature for our next release',
        projectId: 'project_123',
        priority: 'medium',
        status: 'open',
        createdAt: '2023-09-12T15:30:00Z',
        createdBy: {
            id: 'person_123',
            name: 'John Doe'
        }
    },
    async onEnable(context) {
        const client = createClient(context.auth);

        try {
            // Register for issue creation events
            await client.request('POST', '/webhooks/register', {
                url: context.webhookUrl,
                events: ['issue.created']
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
            // Unregister from issue creation events
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
