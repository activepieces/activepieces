import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { createClient } from '../common/client';

const markdown = `
To set up the Huly.io webhook trigger for new issue creation:

1. You'll need to configure a webhook in your Huly.io account to send notifications to Activepieces when a new issue is created.
2. Copy the webhook URL from below and add it to your Huly.io webhooks configuration.
3. Set the event type to "issue.created" when configuring the webhook.
4. Activepieces will start receiving notifications when new issues are created in your Huly.io account.

Note: In a production environment, we would use the @hcengineering/api-client package to automatically register for real-time events.
`;

export const newIssueCreated = createTrigger({
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
        // In a real implementation with @hcengineering/api-client:
        // const client = createClient(context.auth);
        // await client.request('POST', '/webhooks/register', {
        //     url: context.webhookUrl,
        //     events: ['issue.created']
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
