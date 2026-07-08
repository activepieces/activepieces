import { pipedriveAuth } from '../auth';
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
	audience: 'both',
	aiMetadata: { description: 'Retrieve a single product by its exact numeric ID, returning full details and resolved custom fields. Pick this when you already know the product ID; use Find Product to search by name instead. Read-only and returns found:false rather than erroring when the ID does not exist.', idempotent: true },
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
