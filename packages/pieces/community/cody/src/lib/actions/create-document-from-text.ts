import { createAction, Property } from '@activepieces/pieces-framework';
import { codyAuth } from '../..';
import { codyClient } from '../common/client';
import { folderIdDropdown } from '../common/props';

export const createDocumentFromText = createAction({
    auth: codyAuth,
    name: 'create_document_from_text',
    displayName: 'Create Document From Text',
    description: 'Upload text content to create a new document within the Cody knowledge base.',
    props: {
        folder_id: folderIdDropdown,
        name: Property.ShortText({
            displayName: 'Document Name',
            description: 'The name or title of the new document.',
            required: true,
        }),
        content: Property.LongText({
            displayName: 'Content',
            description: 'The text or HTML content to be added to the document. Max 768 KB.',
            required: true,
        }),
    },
    async run(context) {
        const { folder_id, name, content } = context.propsValue;
        const apiKey = context.auth;

        return await codyClient.createDocument(apiKey, name, folder_id, content);
    },
});