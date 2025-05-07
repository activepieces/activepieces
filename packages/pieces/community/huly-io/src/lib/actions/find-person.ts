import { createAction, Property } from '@activepieces/pieces-framework';
import { createClient } from '../common/client';
import { hulyIoAuth } from '../../index';

export const findPerson = createAction({
    auth: hulyIoAuth,
    name: 'find_person',
    displayName: 'Find Person',
    description: 'Search for a person in Huly.io',
    props: {
        query: Property.ShortText({
            displayName: 'Search Query',
            description: 'Search for a person by name, email, or other identifiers',
            required: false,
        }),
        limit: Property.Number({
            displayName: 'Limit',
            description: 'Maximum number of people to return',
            required: false,
            defaultValue: 10,
        }),
    },
    async run({ propsValue, auth }) {
        const client = createClient(auth as string);
        const response = await client.request(
            'GET',
            '/people/search',
            {
                query: propsValue.query || '',
                limit: propsValue.limit || 10
            }
        );

        return response.data || [];
    },
});
