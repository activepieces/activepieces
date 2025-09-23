import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, propsValidation } from '@activepieces/pieces-common';
import { z } from 'zod';
import { capsuleAuth } from '../common/auth';
import { capsuleCommon } from '../common/client';
import { partyDropdown, opportunityDropdown } from '../common/properties';

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
        partyId: partyDropdown({
            refreshers: ['auth'],
            required: false,
        }),
        opportunityId: opportunityDropdown({
            refreshers: ['auth'],
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
        limit: Property.Number({
            displayName: 'Limit',
            description: 'Maximum number of results to return (default: 10)',
            required: false,
            defaultValue: 10
        })
    },
    async run(context) {
        const { searchQuery, partyId, opportunityId, status, limit } = context.propsValue as {
            searchQuery?: string;
            partyId?: string;
            opportunityId?: string;
            status?: string;
            limit?: number;
        };

        // Zod validation
        await propsValidation.validateZod(context.propsValue, {
            searchQuery: z.string().optional(),
            partyId: z.string().optional(),
            opportunityId: z.string().optional(),
            status: z.enum(['OPEN', 'COMPLETED', 'CANCELLED']).optional(),
            limit: z.number().min(1, 'Limit must be at least 1').max(100, 'Limit must be at most 100').optional(),
        });

        const queryParams: Record<string, string> = {};

        if (searchQuery) queryParams['q'] = searchQuery;
        if (partyId && partyId.trim()) queryParams['party_id'] = partyId.trim();
        if (opportunityId && opportunityId.trim()) queryParams['opportunity_id'] = opportunityId.trim();
        if (status) queryParams['status'] = status;
        if (limit) queryParams['perPage'] = limit.toString();

        const response = await capsuleCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.GET,
            resourceUri: '/kases',
            queryParams
        });

        return response.body;
    },
});
