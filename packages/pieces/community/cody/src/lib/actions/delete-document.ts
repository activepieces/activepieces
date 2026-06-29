import { createAction, Property } from '@activepieces/pieces-framework';
import { codyAuth } from '../..';
import { codyClient } from '../common/client';

export const deleteDocumentAction = createAction({
    auth: codyAuth,
    name: 'delete_document',
    displayName: 'Delete Document',
    description: 'Permanently delete a document from the Cody knowledge base.',
    audience: 'ai',
    aiMetadata: {
        description:
            'Permanently removes a document from the Cody knowledge base by its ID. This is destructive and cannot be undone (Cody has no archive). Resolve the document ID via List Documents and confirm it is the correct one before calling. A retry on an already-deleted document returns a 404, so it is not idempotent.',
        idempotent: false,
    },
    props: {
        document_id: Property.ShortText({
            displayName: 'Document ID',
            description:
                'The ID of the document to permanently delete. Resolve via List Documents.',
            required: true,
        }),
    },
    async run(context) {
        const { document_id } = context.propsValue;
        const apiKey = context.auth;

        await codyClient.delete(apiKey, `/documents/${document_id}`);

        return {
            success: true,
            document_id,
        };
    },
});
