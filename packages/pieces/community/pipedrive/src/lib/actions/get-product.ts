import { pipedriveAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
    pipedriveApiCall,
    pipedrivePaginatedApiCall,
    pipedriveTransformCustomFields,
} from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { GetField } from '../common/types'; // GetDealResponse was used here, but it should likely be a generic type or a specific Product response type. Using generic Record<string, any> for now.

export const getProductAction = createAction({
    auth: pipedriveAuth,
    name: 'get-product',
    displayName: 'Retrieve a Product',
    description: 'Finds a product by ID using Pipedrive API v2.', // ✅ Updated description for v2
    props: {
        productId: Property.Number({
            displayName: 'Product ID',
            required: true,
        }),
    },
    async run(context) {
        try {
            // ✅ Use v2 endpoint for retrieving a product
            const response = await pipedriveApiCall<Record<string, any>>({ // Using generic type for flexibility
                accessToken: context.auth.access_token,
                apiDomain: context.auth.data['api_domain'],
                method: HttpMethod.GET,
                resourceUri: `/v2/products/${context.propsValue.productId}`, // ✅ Updated to v2 endpoint
            });

            // ✅ Fetch custom field definitions from v2
            const customFieldsResponse = await pipedrivePaginatedApiCall<GetField>({
                accessToken: context.auth.access_token,
                apiDomain: context.auth.data['api_domain'],
                method: HttpMethod.GET,
                resourceUri: '/v2/productFields', // ✅ Updated to v2 endpoint
            });

            // Transform custom fields in the response data
            const updatedProductProperties = pipedriveTransformCustomFields(
                customFieldsResponse,
                response.data,
            );

            return {
                found: true,
                data: [updatedProductProperties],
            };
        } catch (error) {
            // It's generally good practice to log the actual error for debugging purposes
            console.error("Failed to retrieve product:", error);
            return {
                found: false,
                data: []
            };
        }
    },
});
