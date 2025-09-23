import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, propsValidation } from '@activepieces/pieces-common';
import { z } from 'zod';
import { capsuleAuth } from '../common/auth';
import { capsuleCommon } from '../common/client';
import { partyDropdown, milestoneDropdown } from '../common/properties';

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
        partyId: partyDropdown({
            refreshers: ['auth'],
            required: false,
        }),
        milestoneId: milestoneDropdown({
            refreshers: ['auth'],
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
        const { searchQuery, partyId, milestoneId, status, limit } = context.propsValue as {
            searchQuery?: string;
            partyId?: string;
            milestoneId?: string;
            status?: string;
            limit?: number;
        };

        // Zod validation
        await propsValidation.validateZod(context.propsValue, {
            searchQuery: z.string().optional(),
            partyId: z.string().optional(),
            milestoneId: z.string().optional(),
            status: z.enum(['OPEN', 'WON', 'LOST', 'ABANDONED']).optional(),
            limit: z.number().min(1, 'Limit must be at least 1').max(100, 'Limit must be at most 100').optional(),
        });

        const queryParams: Record<string, string> = {};

        if (searchQuery) queryParams['q'] = searchQuery;
        if (partyId && partyId.trim()) queryParams['partyId'] = partyId.trim();
        if (milestoneId && milestoneId.trim()) queryParams['milestoneId'] = milestoneId.trim();
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
