import { createAction, Property } from '@activepieces/pieces-framework';
import { codyAuth } from '../..';
import { codyClient } from '../common/client';
import { getDocumentOutputSchema } from '../output-schemas';

export const getDocumentAction = createAction({
    auth: codyAuth,
    name: 'get_document',
    displayName: 'Get Document',
    description: 'Retrieve a single Cody knowledge-base document by its ID.',
    audience: 'ai',
    aiMetadata: {
        description:
            "Retrieves the details of a single Cody knowledge-base document by its ID (name, status, content URL, folder). Use this to poll a document's ingestion status after creating it: a freshly created document starts in status pending and a bot cannot answer from it until it is processed. Resolve the document ID via List Documents. Read-only and safe to retry.",
        idempotent: true,
    },
    outputSchema: getDocumentOutputSchema,
    props: {
        document_id: Property.ShortText({
            displayName: 'Document ID',
            description: 'The ID of the document to retrieve. Resolve via List Documents.',
            required: true,
        }),
    },
    async run(context) {
        const { document_id } = context.propsValue;
        const apiKey = context.auth;

        return await codyClient.get(apiKey, `/documents/${document_id}`);
    },
});
