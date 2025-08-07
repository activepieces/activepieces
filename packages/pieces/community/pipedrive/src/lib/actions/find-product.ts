import { pipedriveAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
    pipedriveApiCall,
    pipedrivePaginatedApiCall,
    pipedriveTransformCustomFields,
} from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { GetField } from '../common/types'; // GetDealResponse was used here, but it should likely be a generic type or a specific Product response type. Using generic Record<string, any> for now.
import { isNil } from '@activepieces/shared'; // Assuming this import is correct and needed for isNil check

export const findProductAction = createAction({
    auth: pipedriveAuth,
    name: 'find-product',
    displayName: 'Find Product',
    description: 'Finds a product by name ', 
    props: {
        searchTerm: Property.ShortText({
            displayName: 'Search Term',
            required: true,
        }),
        // The 'exactMatch' property is not directly supported by Pipedrive's /products/search endpoint
        // and is handled client-side in the existing logic.
        exactMatch: Property.Checkbox({
            displayName: 'Exact Match',
            required: false,
            defaultValue: true,
        }),
    },
    async run(context) {
        const { searchTerm, exactMatch } = context.propsValue;

        // Perform a search for products by name using the /v2/products/search endpoint.
        // This endpoint is a wrapper of /v1/itemSearch with a narrower OAuth scope.
        // It supports 'term', 'fields', and 'limit'.
        const searchResponse = await pipedriveApiCall<{
            success: boolean;
            data: { items: Array<{ item: { id: number; name: string; } }> }; // Added 'name' to item for client-side filtering
        }>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/v2/products/search', // ✅ Updated to v2 endpoint
            query: {
                term: searchTerm,
                fields: 'name', // Search specifically by product name
                limit: 100, // Fetch a reasonable number of results to perform client-side filtering if exactMatch is false
            },
        });

        if (isNil(searchResponse.data) || isNil(searchResponse.data.items) || searchResponse.data.items.length === 0) {
            return {
                found: false,
                data: [],
            };
        }

        const filteredItems = [];
        for (const itemWrapper of searchResponse.data.items) {
            const productItem = itemWrapper.item;
            if (productItem && productItem.name) {
                if (exactMatch && productItem.name === searchTerm) {
                    filteredItems.push(productItem);
                } else if (!exactMatch && productItem.name.toLowerCase().includes(searchTerm.toLowerCase())) {
                    filteredItems.push(productItem);
                }
            }
        }

        if (filteredItems.length === 0) {
            return {
                found: false,
                data: [],
            };
        }

        // Fetch full product details for the first found item (or iterate if multiple are needed)
        // Pipedrive v2 supports /products/{id} endpoint.
        const productDetailsResponse = await pipedriveApiCall<Record<string, any>>({ // Using generic type for flexibility
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: `/v2/products/${filteredItems[0].id}`, // ✅ Updated to v2 endpoint
        });

        // Fetch custom field definitions from v2
        const customFieldsResponse = await pipedrivePaginatedApiCall<GetField>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/v2/productFields', // ✅ Updated to v2 endpoint
        });

        // Transform custom fields in the response data
        const updatedProductProperties = pipedriveTransformCustomFields(
            customFieldsResponse,
            productDetailsResponse.data,
        );

        return {
            found: true,
            data: [updatedProductProperties], // Return the first found and transformed product
        };
    },
});
