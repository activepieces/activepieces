import { createAction, Property } from '@activepieces/pieces-framework';
import { codyAuth } from '../..';
import { codyClient } from '../common/client';
import { listDocumentsOutputSchema } from '../output-schemas';

export const listDocumentsAction = createAction({
    auth: codyAuth,
    name: 'list_documents',
    displayName: 'List Documents',
    description: 'List or search documents in the Cody knowledge base.',
    audience: 'ai',
    aiMetadata: {
        description:
            "Lists documents in the Cody knowledge base, optionally filtered by folder ID, conversation ID, or a name keyword, returning each document's ID and ingestion status. This is the resolver for the document IDs used in focus mode (Create/Update Conversation) and for Get Document and Delete Document. Read-only and safe to retry.",
        idempotent: true,
    },
    outputSchema: listDocumentsOutputSchema,
    props: {
        folder_id: Property.ShortText({
            displayName: 'Folder ID',
            description:
                'Optional folder ID to list documents from. Resolve via List Folders. Omit to list across all folders.',
            required: false,
        }),
        conversation_id: Property.ShortText({
            displayName: 'Conversation ID',
            description:
                'Optional conversation ID to list the focus-mode documents of. Resolve via List Conversations.',
            required: false,
        }),
        keyword: Property.ShortText({
            displayName: 'Keyword',
            description: 'Optional name keyword to filter documents by (partial match).',
            required: false,
        }),
        page: Property.Number({
            displayName: 'Page',
            description: 'Optional 1-based page number for pagination.',
            required: false,
        }),
        per_page: Property.Number({
            displayName: 'Per Page',
            description: 'Optional number of documents to return per page.',
            required: false,
        }),
    },
    async run(context) {
        const { folder_id, conversation_id, keyword, page, per_page } = context.propsValue;
        const apiKey = context.auth;

        const queryParams: Record<string, string> = {};
        if (folder_id) {
            queryParams['folder_id'] = folder_id;
        }
        if (conversation_id) {
            queryParams['conversation_id'] = conversation_id;
        }
        if (keyword) {
            queryParams['keyword'] = keyword;
        }
        if (page !== undefined && page !== null) {
            queryParams['page'] = String(page);
        }
        if (per_page !== undefined && per_page !== null) {
            queryParams['per_page'] = String(per_page);
        }

        return await codyClient.get(apiKey, `/documents`, queryParams);
    },
});
