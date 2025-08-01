import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { missiveAuth } from '../common/auth';
import { missiveCommon } from '../common/client';

export const findContact = createAction({
    name: 'find_contact',
    displayName: 'Find Contact',
    description: 'Search for a contact by email, name, or contact book',
    auth: missiveAuth,
    props: {
        email: Property.ShortText({
            displayName: 'Email',
            description: 'Email address to search for',
            required: false,
        }),
        name: Property.ShortText({
            displayName: 'Name',
            description: 'Name to search for (first name, last name, or full name)',
            required: false,
        }),
        contact_book: Property.ShortText({
            displayName: 'Contact Book ID',
            description: 'Contact book ID to search within',
            required: false,
        }),
        limit: Property.Number({
            displayName: 'Limit',
            description: 'Maximum number of contacts to return',
            required: false,
            defaultValue: 50,
        }),
        offset: Property.Number({
            displayName: 'Offset',
            description: 'Number of contacts to skip',
            required: false,
            defaultValue: 0,
        }),
        starred: Property.Checkbox({
            displayName: 'Starred Only',
            description: 'Filter to show only starred contacts',
            required: false,
        }),
        deleted: Property.Checkbox({
            displayName: 'Include Deleted',
            description: 'Include deleted contacts in the results',
            required: false,
        })
    },
    async run(context) {
        const {
            email,
            name,
            contact_book,
            limit,
            offset,
            starred,
            deleted
        } = context.propsValue;

        const queryParams: Record<string, string> = {};

        if (email) queryParams['email'] = email;
        if (name) queryParams['name'] = name;
        if (contact_book) queryParams['contact_book'] = contact_book;
        if (limit) queryParams['limit'] = limit.toString();
        if (offset) queryParams['offset'] = offset.toString();
        if (starred !== undefined) queryParams['starred'] = starred.toString();
        if (deleted !== undefined) queryParams['deleted'] = deleted.toString();

        const response = await missiveCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.GET,
            resourceUri: '/contacts',
            queryParams,
        });

        return response.body;
    },
}); 