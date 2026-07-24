import { createAction, Property } from '@activepieces/pieces-framework';
import { codyAuth } from '../..';
import { codyClient } from '../common/client';
import { listFoldersOutputSchema } from '../output-schemas';

export const listFoldersAction = createAction({
    auth: codyAuth,
    name: 'list_folders',
    displayName: 'List Folders',
    description: 'List or search the knowledge-base folders in the Cody workspace.',
    audience: 'ai',
    aiMetadata: {
        description:
            'Lists the knowledge-base folders in the Cody workspace, optionally filtered by a name keyword. This is the key resolver for the folder ID required by every document-create action (Create Text Document, Upload File to Knowledge Base, Create Document From Webpage). Read-only and safe to retry.',
        idempotent: true,
    },
    outputSchema: listFoldersOutputSchema,
    props: {
        keyword: Property.ShortText({
            displayName: 'Keyword',
            description:
                'Optional name keyword to filter folders by (partial match). Omit to list all folders.',
            required: false,
        }),
        page: Property.Number({
            displayName: 'Page',
            description: 'Optional 1-based page number for pagination.',
            required: false,
        }),
        per_page: Property.Number({
            displayName: 'Per Page',
            description: 'Optional number of folders to return per page.',
            required: false,
        }),
    },
    async run(context) {
        const { keyword, page, per_page } = context.propsValue;
        const apiKey = context.auth;

        const queryParams: Record<string, string> = {};
        if (keyword) {
            queryParams['keyword'] = keyword;
        }
        if (page !== undefined && page !== null) {
            queryParams['page'] = String(page);
        }
        if (per_page !== undefined && per_page !== null) {
            queryParams['per_page'] = String(per_page);
        }

        return await codyClient.get(apiKey, `/folders`, queryParams);
    },
});
