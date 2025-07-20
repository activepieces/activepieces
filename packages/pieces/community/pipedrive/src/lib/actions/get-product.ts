import { pipedriveAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
	pipedriveApiCall,
	pipedrivePaginatedApiCall,
	pipedriveTransformCustomFields,
} from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { GetDealResponse, GetField } from '../common/types';

export const getProductAction = createAction({
	auth: pipedriveAuth,
	name: 'get-product',
	displayName: 'Retrieve a Product',
	description: ' Finds a product by ID.',
	props: {
		productId: Property.Number({
			displayName: 'Product ID',
			required: true,
		}),
	},
	async run(context) {
		try {
			const response = await pipedriveApiCall<GetDealResponse>({
				accessToken: context.auth.access_token,
				apiDomain: context.auth.data['api_domain'],
				method: HttpMethod.GET,
				resourceUri: `/products/${context.propsValue.productId}`,
			});

			const customFieldsResponse = await pipedrivePaginatedApiCall<GetField>({
				accessToken: context.auth.access_token,
				apiDomain: context.auth.data['api_domain'],
				method: HttpMethod.GET,
				resourceUri: '/productFields',
			});

			const updatedProductProperties = pipedriveTransformCustomFields(
				customFieldsResponse,
				response.data,
			);

			return {
				found: true,
				data: [updatedProductProperties],
			};
		} catch (error) {
			return {
				found: false,
                data:[]
			};
		}
	},
});
