import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { capsuleAuth } from '../common/auth';
import { capsuleCommon } from '../common/client';

export const findContact = createAction({
    name: 'find_contact',
    displayName: 'Find Contact',
    description: 'Find a person or organisation by search criteria',
    auth: capsuleAuth,
    props: {
        searchQuery: Property.ShortText({
            displayName: 'Search Query',
            description: 'Search term to find contacts (name, email, etc.)',
            required: false,
        }),
        email: Property.ShortText({
            displayName: 'Email Address',
            description: 'Find contact by email address',
            required: false,
        }),
        type: Property.StaticDropdown({
            displayName: 'Contact Type',
            description: 'Filter by contact type',
            required: false,
            options: {
                options: [
                    { label: 'Person', value: 'person' },
                    { label: 'Organisation', value: 'organisation' }
                ]
            }
        }),
        tag: Property.ShortText({
            displayName: 'Tag',
            description: 'Find contacts with specific tag',
            required: false,
        }),
        limit: Property.Number({
            displayName: 'Limit',
            description: 'Maximum number of results to return (default: 10)',
            required: false,
            defaultValue: 10
        })
    },
    async run(context) {
        const { searchQuery, email, type, tag, limit } = context.propsValue;

        const queryParams: Record<string, string> = {};

        if (searchQuery) queryParams['q'] = searchQuery;
        if (email) queryParams['email'] = email;
        if (type) queryParams['type'] = type;
        if (tag) queryParams['tag'] = tag;
        if (limit) queryParams['perPage'] = limit.toString();

        const response = await capsuleCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.GET,
            resourceUri: '/parties',
            queryParams
        });

        return response.body;
    },
});
