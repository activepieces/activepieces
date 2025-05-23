import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { createClient } from '../common/client';
import { hulyIoAuth } from '../../index';

const markdown = `
To set up the Huly.io WebSocket trigger for new document creation:

1. This trigger uses Huly.io's WebSocket API to register for real-time events.
2. When enabled, Activepieces will automatically register to receive notifications when new documents are created.
3. Documents will be delivered to your flow in real-time.
4. No additional webhook configuration is needed in your Huly.io account.
`;

export const newDocumentCreated = createTrigger({
    auth: hulyIoAuth,
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
        const client = createClient(context.auth);

        try {
            // Register for document creation events
            await client.request('POST', '/webhooks/register', {
                url: context.webhookUrl,
                events: ['document.created']
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
            // Unregister from document creation events
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
