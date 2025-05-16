import { createAction, Property } from '@activepieces/pieces-framework';
import { createClient } from '../common/client';

export const findDocument = createAction({
    name: 'find_document',
    displayName: 'Find Document',
    description: 'List documents in a teamspace by name',
    props: {
        teamspaceId: Property.ShortText({
            displayName: 'Teamspace ID',
            description: 'The ID of the teamspace to search for documents in',
            required: true,
        }),
        name: Property.ShortText({
            displayName: 'Document Name',
            description: 'Filter documents by name',
            required: false,
        }),
        limit: Property.Number({
            displayName: 'Limit',
            description: 'Maximum number of documents to return',
            required: false,
            defaultValue: 10,
        }),
    },
    async run({ propsValue, auth }) {
        const client = createClient(auth as string);
        const response = await client.request(
            'GET',
            '/documents/search',
            {
                teamspaceId: propsValue.teamspaceId,
                name: propsValue.name || undefined,
                limit: propsValue.limit || 10
            }
        );

        return response.data || [];
    },
});
