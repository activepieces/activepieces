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
	description: 'Finds a product or products by name or product code.',
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

		do {
			const qs = {
				term: context.propsValue.fieldValue,
				fields: context.propsValue.field,
				limit: 100,
				start: 0,
				exact_match: 'true',
			};
			const response = await pipedriveApiCall<{
				success: boolean;
				data: { items: Array<{ item: { id: number } }> };
				additional_data: {
					pagination: {
						start: number;
						limit: number;
						more_items_in_collection: boolean;
						next_start: number;
					};
				};
			}>({
				accessToken: context.auth.access_token,
				apiDomain: context.auth.data['api_domain'],
				method: HttpMethod.GET,
				resourceUri: '/products/search',
				query: qs,
			});

			if (isNil(response.data.items)) break;

			for(const product of response.data.items)
			{
				products.push(product.item);
			}
            
			hasMoreItems = response.additional_data.pagination.more_items_in_collection;
			qs.start = response.additional_data.pagination.next_start;
		} while (hasMoreItems);

		return {
			found: products.length > 0,
			data: products,
		};
	},
});
