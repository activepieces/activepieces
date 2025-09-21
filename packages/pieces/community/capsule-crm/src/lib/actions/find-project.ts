import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { capsuleAuth } from '../common/auth';
import { capsuleCommon } from '../common/client';

export const findProject = createAction({
    name: 'find_project',
    displayName: 'Find Project',
    description: 'Find a project by search criteria',
    auth: capsuleAuth,
    props: {
        searchQuery: Property.ShortText({
            displayName: 'Search Query',
            description: 'Search term to find projects by name or description',
            required: false,
        }),
        partyId: Property.ShortText({
            displayName: 'Party ID',
            description: 'Find projects associated with a specific party',
            required: false,
        }),
        opportunityId: Property.ShortText({
            displayName: 'Opportunity ID',
            description: 'Find projects associated with a specific opportunity',
            required: false,
        }),
        status: Property.StaticDropdown({
            displayName: 'Status',
            description: 'Filter projects by status',
            required: false,
            options: {
                options: [
                    { label: 'Open', value: 'OPEN' },
                    { label: 'Completed', value: 'COMPLETED' },
                    { label: 'Cancelled', value: 'CANCELLED' }
                ]
            }
        }),
        category: Property.ShortText({
            displayName: 'Category',
            description: 'Find projects by category',
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
        const { searchQuery, partyId, opportunityId, status, category, limit } = context.propsValue;

        const queryParams: Record<string, string> = {};

        if (searchQuery) queryParams['q'] = searchQuery;
        if (partyId) queryParams['partyId'] = partyId;
        if (opportunityId) queryParams['opportunityId'] = opportunityId;
        if (status) queryParams['status'] = status;
        if (category) queryParams['category'] = category;
        if (limit) queryParams['perPage'] = limit.toString();

        const response = await capsuleCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.GET,
            resourceUri: '/projects',
            queryParams
        });

        return response.body;
    },
});
