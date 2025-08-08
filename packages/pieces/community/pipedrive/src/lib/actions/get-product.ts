import { pipedriveAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
    pipedriveApiCall,
    pipedrivePaginatedApiCall,
    pipedriveTransformCustomFields,
} from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { GetField } from '../common/types'; 

export const getProductAction = createAction({
    auth: pipedriveAuth,
    name: 'get-product',
    displayName: 'Retrieve a Product',
    description: 'Finds a product by ID using Pipedrive API v2.', 
    props: {
        productId: Property.Number({
            displayName: 'Product ID',
            required: true,
        }),
    },
    async run(context) {
        try {
           
            const response = await pipedriveApiCall<Record<string, any>>({ 
                accessToken: context.auth.access_token,
                apiDomain: context.auth.data['api_domain'],
                method: HttpMethod.GET,
                resourceUri: `/v2/products/${context.propsValue.productId}`, 
            });

           
            const customFieldsResponse = await pipedrivePaginatedApiCall<GetField>({
                accessToken: context.auth.access_token,
                apiDomain: context.auth.data['api_domain'],
                method: HttpMethod.GET,
                resourceUri: '/v2/productFields', 
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
            
            console.error("Failed to retrieve product:", error);
            return {
                found: false,
                data: []
            };
        }
    },
});
