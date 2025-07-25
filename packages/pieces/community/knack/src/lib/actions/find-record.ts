import { createAction, Property, ActionContext } from '@activepieces/pieces-framework';
import { knackAuth } from '../auth';
import { makeClient } from '../client';

export const findRecord = createAction({
    name: 'find_record',
    displayName: 'Find Record',
    description: 'Search for a single record using field filters',
    auth: knackAuth,
    props: {
        objectKey: Property.ShortText({
            displayName: 'Object Key',
            description: 'The key of the object/table to search in',
            required: true,
        }),
        filters: Property.Object({
            displayName: 'Filters',
            description: 'The filters to search with (e.g., {email: "test@example.com"})',
            required: true,
        }),
    },
    async run(context) {
        const client = makeClient(context.auth);
        const response = await client.get(`/objects/${context.propsValue.objectKey}/records`, {
            params: context.propsValue.filters
        });
        
        return response.data;
    },
});
