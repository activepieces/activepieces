import { createAction, Property } from '@activepieces/pieces-framework';
import { createClient } from '../common/client';

export const createDocument = createAction({
    name: 'create_document',
    displayName: 'Create Document',
    description: 'Create a Markdown-based document inside a teamspace',
    props: {
        teamspaceId: Property.ShortText({
            displayName: 'Teamspace ID',
            description: 'The ID of the teamspace to create the document in',
            required: true,
        }),
        title: Property.ShortText({
            displayName: 'Title',
            description: 'The title of the document',
            required: true,
        }),
        content: Property.LongText({
            displayName: 'Content',
            description: 'The content of the document in Markdown format',
            required: true,
        }),
        folderId: Property.ShortText({
            displayName: 'Folder ID',
            description: 'The ID of the folder to place the document in (if any)',
            required: false,
        }),
        tags: Property.Array({
            displayName: 'Tags',
            description: 'Tags to categorize the document',
            required: false,
        }),
    },
    async run({ propsValue, auth }) {
        const client = createClient(auth as string);
        const response = await client.request(
            'POST',
            '/documents/create',
            {
                teamspaceId: propsValue.teamspaceId,
                title: propsValue.title,
                content: propsValue.content,
                folderId: propsValue.folderId || undefined,
                tags: propsValue.tags || []
            }
        );

        return response.data || {};
    },
});
