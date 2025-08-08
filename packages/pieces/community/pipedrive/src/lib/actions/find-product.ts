import { pipedriveAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
    pipedriveApiCall,
    pipedrivePaginatedApiCall,
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
    props: {
        searchTerm: Property.ShortText({
            displayName: 'Search Term',
            required: true,
        }),
        
        exactMatch: Property.Checkbox({
            displayName: 'Exact Match',
            required: false,
            defaultValue: true,
        }),
    },
    async run(context) {
        const { searchTerm, exactMatch } = context.propsValue;

        
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
                limit: 100,
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
        const productDetailsResponse = await pipedriveApiCall<Record<string, any>>({ // Using generic type for flexibility
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: `/v2/products/${filteredItems[0].id}`, 
        });

        // Fetch custom field definitions from v2
        const customFieldsResponse = await pipedrivePaginatedApiCall<GetField>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/v2/productFields', 
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
