import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { createClient } from '../common/client';
import { hulyIoAuth } from '../../index';

const markdown = `
To set up the Huly.io WebSocket trigger for new milestone creation:

1. This trigger uses Huly.io's WebSocket API to register for real-time events.
2. When enabled, Activepieces will automatically register to receive notifications when new milestones are created.
3. Milestones will be delivered to your flow in real-time.
4. No additional webhook configuration is needed in your Huly.io account.
`;

export const newMilestoneCreated = createTrigger({
    auth: hulyIoAuth,
    name: 'new_milestone_created',
    displayName: 'New Milestone Created',
    description: 'Triggered when a new milestone is created in Huly.io',
    props: {
        md: Property.MarkDown({
            value: markdown,
        }),
    },
    type: TriggerStrategy.WEBHOOK,
    sampleData: {
        id: 'milestone_789',
        name: 'Version 2.0',
        description: 'Major release with new features and improvements',
        projectId: 'project_123',
        dueDate: '2023-12-31T23:59:59Z',
        issueIds: ['issue_456', 'issue_457'],
        createdAt: '2023-09-12T16:30:00Z',
        createdBy: {
            id: 'person_123',
            name: 'John Doe'
        }
    },
    async onEnable(context) {
        const client = createClient(context.auth);

        try {
            // Register for milestone creation events
            await client.request('POST', '/webhooks/register', {
                url: context.webhookUrl,
                events: ['milestone.created']
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
            // Unregister from milestone creation events
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
