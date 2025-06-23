import { pipedriveAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
	pipedriveApiCall,
	pipedrivePaginatedApiCall,
	pipedriveTransformCustomFields,
} from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { GetDealResponse, GetField } from '../common/types';

export const findProductAction = createAction({
	auth: pipedriveAuth,
	name: 'find-product',
	displayName: 'Find Product',
	description: 'Find a product by name.',
	props: {
		searchTerm: Property.ShortText({
			displayName: 'Search Term',
			required: true,
		}),
	},
	async run(context) {
		const response = await pipedriveApiCall<{
			success: boolean;
			data: { items: Array<{ item: { id: number } }> };
		}>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: '/products/search',
			query: {
				term: context.propsValue.searchTerm,
				fields: 'name',
				limit: 1,
			},
		});

		if (response.data.items.length === 0) {
			return {
				found: false,
				data: [],
			};
		}

		const productResponse = await pipedriveApiCall<GetDealResponse>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: `/products/${response.data.items[0].item.id}`,
		});

		const customFieldsResponse = await pipedrivePaginatedApiCall<GetField>({
			accessToken: context.auth.access_token,
			apiDomain: context.auth.data['api_domain'],
			method: HttpMethod.GET,
			resourceUri: '/productFields',
		});

		const updatedProductProperties = pipedriveTransformCustomFields(
			customFieldsResponse,
			productResponse.data,
		);

		return {
			found: true,
			data: [updatedProductProperties],
		};
	},
});
