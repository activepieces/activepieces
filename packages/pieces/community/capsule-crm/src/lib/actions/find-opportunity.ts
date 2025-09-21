import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { capsuleAuth } from '../common/auth';
import { capsuleCommon } from '../common/client';

export const findOpportunity = createAction({
    name: 'find_opportunity',
    displayName: 'Find Opportunity',
    description: 'Find an opportunity by search criteria',
    auth: capsuleAuth,
    props: {
        searchQuery: Property.ShortText({
            displayName: 'Search Query',
            description: 'Search term to find opportunities by name or description',
            required: false,
        }),
        partyId: Property.ShortText({
            displayName: 'Party ID',
            description: 'Find opportunities associated with a specific party',
            required: false,
        }),
        milestoneId: Property.ShortText({
            displayName: 'Milestone ID',
            description: 'Find opportunities at a specific milestone/stage',
            required: false,
        }),
        status: Property.StaticDropdown({
            displayName: 'Status',
            description: 'Filter opportunities by status',
            required: false,
            options: {
                options: [
                    { label: 'Open', value: 'OPEN' },
                    { label: 'Won', value: 'WON' },
                    { label: 'Lost', value: 'LOST' },
                    { label: 'Abandoned', value: 'ABANDONED' }
                ]
            }
        }),
        limit: Property.Number({
            displayName: 'Limit',
            description: 'Maximum number of results to return (default: 10)',
            required: false,
            defaultValue: 10
        })
    },
    async run(context) {
        const { searchQuery, partyId, milestoneId, status, limit } = context.propsValue;

        const queryParams: Record<string, string> = {};

        if (searchQuery) queryParams['q'] = searchQuery;
        if (partyId) queryParams['partyId'] = partyId;
        if (milestoneId) queryParams['milestoneId'] = milestoneId;
        if (status) queryParams['status'] = status;
        if (limit) queryParams['perPage'] = limit.toString();

        const response = await capsuleCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.GET,
            resourceUri: '/opportunities',
            queryParams
        });

        return response.body;
    },
});
