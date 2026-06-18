import { pipedriveAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
    pipedriveApiCall,
    pipedrivePaginatedV1ApiCall,
    pipedriveTransformCustomFields,
} from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { GetField } from '../common/types'; 
import { isNil } from '@activepieces/shared'; 

export const findProductAction = createAction({
    auth: pipedriveAuth,
    name: 'find-product',
    displayName: 'Find Product',
    description: 'Finds a product by name ',
    audience: 'both',
    aiMetadata: { description: 'Search the product catalog by name and return the single best-matching product with its full details and custom fields. Pick this when you have a product name or keyword rather than an ID; use Retrieve a Product when you already know the exact product ID. Read-only and returns at most one match (found:false when nothing matches).', idempotent: true },
    props: {
        searchTerm: Property.ShortText({
            displayName: 'Search Term',
            required: true,
        }),
        
    },
    async run(context) {
        const { searchTerm } = context.propsValue;

        
        const searchResponse = await pipedriveApiCall<{
            success: boolean;
            data: { items: Array<{ item: { id: number; name: string; } }> }; 
        }>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/v2/products/search', 
            query: {
                term: searchTerm,
                fields: 'name',
                limit: 1,
                include_fields:'product.price'
            },
        });

        if (isNil(searchResponse.data) || isNil(searchResponse.data.items) || searchResponse.data.items.length === 0) {
            return {
                found: false,
                data: [],
            };
        }

        const productDetailsResponse = await pipedriveApiCall<Record<string, any>>({ 
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: `/v2/products/${searchResponse.data.items[0].item.id}`, 
        });

        const customFieldsResponse = await pipedrivePaginatedV1ApiCall<GetField>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/v1/productFields', 
        });

        // Transform custom fields in the response data
        const updatedProductProperties = pipedriveTransformCustomFields(
            customFieldsResponse,
            productDetailsResponse.data,
        );

        return {
            found: true,
            data: [updatedProductProperties], 
        };
    },
});
