import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { teamworkAuth } from '../common/auth';
import { teamworkCommon } from '../common/client';

export const findCompany = createAction({
    name: 'find_company',
    displayName: 'Find Company',
    description: 'Search for companies in Teamwork',
    auth: teamworkAuth,
    props: {
        searchTerm: Property.ShortText({
            displayName: 'Search Term',
            description: 'Search term to find companies by name',
            required: false,
        }),
        domain: Property.ShortText({
            displayName: 'Domain',
            description: 'Search companies by website domain',
            required: false,
        }),
    },
    async run(context) {
        const { searchTerm, domain } = context.propsValue;

        let endpoint = '/companies.json';
        const queryParams: Record<string, string> = {};

        if (searchTerm) queryParams['searchTerm'] = searchTerm;
        if (domain) queryParams['domain'] = domain;

        const response = await teamworkCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.GET,
            resourceUri: endpoint,
            queryParams: Object.keys(queryParams).length > 0 ? queryParams : undefined,
        });

        return {
            companies: response.companies || [],
            total: response.companies?.length || 0,
        };
    },
});
