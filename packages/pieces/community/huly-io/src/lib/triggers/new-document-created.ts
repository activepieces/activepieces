import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { createClient } from '../common/client';

const markdown = `
To set up the Huly.io webhook trigger for new document creation:

1. You'll need to configure a webhook in your Huly.io account to send notifications to Activepieces when a new document is created.
2. Copy the webhook URL from below and add it to your Huly.io webhooks configuration.
3. Set the event type to "document.created" when configuring the webhook.
4. Activepieces will start receiving notifications when new documents are created in your Huly.io account.

Note: In a production environment, we would use the @hcengineering/api-client package to automatically register for real-time events.
`;

export const newDocumentCreated = createTrigger({
    name: 'new_document_created',
    displayName: 'New Document Created',
    description: 'Triggered when a new document is created in Huly.io',
    props: {
        md: Property.MarkDown({
            value: markdown,
        }),
    },
    type: TriggerStrategy.WEBHOOK,
    sampleData: {
        id: 'document_321',
        title: 'Project Requirements',
        content: '# Project Requirements\n\nThis document outlines the requirements for our next project...',
        teamspaceId: 'teamspace_456',
        folderId: 'folder_789',
        tags: ['requirements', 'project'],
        createdAt: '2023-09-12T17:30:00Z',
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
        //     events: ['document.created']
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
