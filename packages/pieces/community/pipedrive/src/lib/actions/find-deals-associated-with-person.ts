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
    description: 'Finds multiple deals related to a specific person using Pipedrive API v2.', 
    props: {
        personId: personIdProp(true), // This prop returns the numeric person ID
    },
    async run(context) {
        const { personId } = context.propsValue;

       
        const deals = await pipedrivePaginatedApiCall<Record<string, any>>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: `/v2/deals`, 
            query: {
                person_id: personId, 
                sort_by: 'update_time',
                sort_direction: 'desc', 
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
            resourceUri: '/v2/dealFields', 
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
