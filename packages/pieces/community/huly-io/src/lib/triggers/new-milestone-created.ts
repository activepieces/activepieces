import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { createClient } from '../common/client';

const markdown = `
To set up the Huly.io webhook trigger for new milestone creation:

1. You'll need to configure a webhook in your Huly.io account to send notifications to Activepieces when a new milestone is created.
2. Copy the webhook URL from below and add it to your Huly.io webhooks configuration.
3. Set the event type to "milestone.created" when configuring the webhook.
4. Activepieces will start receiving notifications when new milestones are created in your Huly.io account.

Note: In a production environment, we would use the @hcengineering/api-client package to automatically register for real-time events.
`;

export const newMilestoneCreated = createTrigger({
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
        // In a real implementation with @hcengineering/api-client:
        // const client = createClient(context.auth);
        // await client.request('POST', '/webhooks/register', {
        //     url: context.webhookUrl,
        //     events: ['milestone.created']
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
