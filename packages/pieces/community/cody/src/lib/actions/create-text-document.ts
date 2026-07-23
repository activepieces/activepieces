import { createAction, Property } from '@activepieces/pieces-framework';
import { codyAuth } from '../..';
import { codyClient } from '../common/client';
import { createTextDocumentOutputSchema } from '../output-schemas';

export const createTextDocumentAction = createAction({
    auth: codyAuth,
    name: 'create_text_document',
    displayName: 'Create Text Document',
    description: 'Create a Cody knowledge-base document from raw text or HTML.',
    audience: 'ai',
    aiMetadata: {
        description:
            'Creates a new document in a Cody knowledge-base folder from raw text or HTML content, so a bot can later answer from it. Use when ingesting inline or generated text; for a file use Upload File to Knowledge Base, for a web page use Create Document From Webpage. Resolve the folder ID first via List Folders (or create one with Create Folder). Ingestion is asynchronous (the document starts in status pending) so poll Get Document for status before querying. Requires a folder ID, a name, and the content (max 768 KB); creates a new document each call, so it is not idempotent.',
        idempotent: false,
    },
    outputSchema: createTextDocumentOutputSchema,
    props: {
        folder_id: Property.ShortText({
            displayName: 'Folder ID',
            description: 'The ID of the folder to create the document in. Resolve via List Folders.',
            required: true,
        }),
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
