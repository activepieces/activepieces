import { pipedriveAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
	pipedriveApiCall,
	pipedrivePaginatedV1ApiCall,
	pipedriveTransformCustomFields,
} from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { GetField } from '../common/types';

export const getProductAction = createAction({
	auth: pipedriveAuth,
	name: 'get-product',
	displayName: 'Retrieve a Product',
	description: 'Finds a product by ID.',
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

			const customFieldsResponse = await pipedrivePaginatedV1ApiCall<GetField>({
				accessToken: context.auth.access_token,
				apiDomain: context.auth.data['api_domain'],
				method: HttpMethod.GET,
				resourceUri: '/v1/productFields',
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
				data: [],
			};
		}
	},
});
