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

export const findProductsAction = createAction({
    auth: pipedriveAuth,
    name: 'find-products',
    displayName: 'Find Products',
    description: 'Finds a product or products by name or product code using Pipedrive API v2.', 
    props: {
        field: Property.StaticDropdown({
            displayName: 'Field to search by',
            required: true,
            defaultValue: 'name',
            options: {
                disabled: false,
                options: [
                    {
                        label: 'Name',
                        value: 'name',
                    },
                    {
                        label: 'Product Code',
                        value: 'code',
                    },
                ],
            },
        }),
        fieldValue: Property.ShortText({
            displayName: 'Field Value',
            required: true,
        }),
    },
    async run(context) {
        const products = [];
        let hasMoreItems = true;
        let cursor: string | null | undefined = undefined; 

        do {
            const queryParams: Record<string, any> = {
                term: context.propsValue.fieldValue,
                fields: context.propsValue.field,
                limit: 500,
            };

            // Add cursor for pagination
            if (cursor) {
                queryParams.cursor = cursor; 
            }

            const response = await pipedriveApiCall<{
                success: boolean;
                data: { items: Array<{ item: { id: number; [key: string]: any } }> }; // Added index signature for flexible item properties
                additional_data: {
                    pagination: {
                        // In v2, pagination uses cursor and next_cursor
                        more_items_in_collection: boolean;
                        next_cursor?: string; 
                    };
                };
            }>({
                accessToken: context.auth.access_token,
                apiDomain: context.auth.data['api_domain'],
                method: HttpMethod.GET,
                resourceUri: '/v2/products/search', 
                query: queryParams,
            });

            if (isNil(response.data) || isNil(response.data.items)) break;

            for (const productWrapper of response.data.items) {
                // Fetch full product details for each found item
                // The search endpoint returns minimal data, so a subsequent call is often needed.
                const productDetails = await pipedriveApiCall<Record<string, any>>({
                    accessToken: context.auth.access_token,
                    apiDomain: context.auth.data['api_domain'],
                    method: HttpMethod.GET,
                    resourceUri: `/v2/products/${productWrapper.item.id}`, 
                });
                products.push(productDetails.data); // Push the full product data
            }

            hasMoreItems = response.additional_data.pagination.more_items_in_collection;
            cursor = response.additional_data.pagination.next_cursor; 
        } while (hasMoreItems && cursor); 

        // Fetch custom field definitions from v2 (only once, after all products are fetched)
        const customFieldsResponse = await pipedrivePaginatedApiCall<GetField>({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.GET,
            resourceUri: '/v2/productFields', 
        });

        // Transform custom fields for all fetched products
        const transformedProducts = products.map(product =>
            pipedriveTransformCustomFields(customFieldsResponse, product)
        );

        return {
            found: transformedProducts.length > 0,
            data: transformedProducts,
        };
    },
});
