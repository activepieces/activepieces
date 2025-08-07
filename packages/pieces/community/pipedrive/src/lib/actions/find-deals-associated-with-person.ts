import { pipedriveAuth } from '../../index';
import { createAction } from '@activepieces/pieces-framework';
import { personIdProp } from '../common/props';
import { pipedrivePaginatedApiCall, pipedriveTransformCustomFields } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { isNil } from '@activepieces/shared';
import { GetField } from '../common/types';

export const findDealsAssociatedWithPersonAction = createAction({
    auth: pipedriveAuth,
    name: 'find-deals-associated-with-person',
    displayName: 'Find Deals Associated With Person',
    description: 'Finds multiple deals related to a specific person using Pipedrive API v2.', // ✅ Updated description for v2
    props: {
        personId: personIdProp(true), // This prop returns the numeric person ID
    },
    async run(context) {
        const { personId } = context.propsValue;

        // ✅ In Pipedrive API v2, the endpoint to get deals associated with a person
        // is now the general /v2/deals endpoint with a person_id query parameter,
        // replacing the old /persons/{id}/deals endpoint.
        const deals = await pipedrivePaginatedApiCall<Record<string, any>>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: `/v2/deals`, // ✅ Updated to v2 general deals endpoint
            query: {
                person_id: personId, // ✅ Filter by person_id
                sort_by: 'update_time', // ✅ Replaced 'sort' with 'sort_by'
                sort_direction: 'desc', // ✅ Added 'sort_direction'
            },
        });

        if (isNil(deals) || deals.length === 0) {
            return {
                found: false,
                data: [],
            };
        }

        // Fetch custom field definitions from v2
        const customFieldsResponse = await pipedrivePaginatedApiCall<GetField>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/v2/dealFields', // ✅ Updated to v2 endpoint
        });

        const result = [];
        for (const deal of deals) {
            // pipedriveTransformCustomFields should correctly handle v2 custom field structure in the response
            const updatedDealProperties = pipedriveTransformCustomFields(customFieldsResponse, deal);
            result.push(updatedDealProperties);
        }

        return {
            found: true,
            data: result,
        };
    },
});
