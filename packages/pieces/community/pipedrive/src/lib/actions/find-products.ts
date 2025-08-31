import { pipedriveAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
	pipedriveApiCall,
	pipedrivePaginatedV1ApiCall,
	pipedrivePaginatedV2ApiCall,
	pipedriveTransformCustomFields,
} from '../common';
import { HttpMethod, QueryParams } from '@activepieces/pieces-common';
import { isNil } from '@activepieces/shared';
import { GetField } from '../common/types';

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
		const qs: QueryParams = {
			term: context.propsValue.fieldValue,
			fields: context.propsValue.field,
			exact_match: 'true',
			limit: '100',
		};

		let cursor: string | undefined = undefined;

		let hasMoreItems = true;
		const products = [];

		do {
			if (cursor) {
				qs.cursor = cursor;
			}
			const response = await pipedriveApiCall<{
				success: boolean;
				data: { items: Array<{ item: { id: number } }> };
				additional_data: {
					next_cursor?: string;
				};
			}>({
				accessToken: context.auth.access_token,
				apiDomain: context.auth.data['api_domain'],
				method: HttpMethod.GET,
				resourceUri: '/v2/products/search',
				query: {
					term: context.propsValue.fieldValue,
					fields: context.propsValue.field,
					exact_match: 'true',
				},
			});

			if (isNil(response.data.items)) break;

			for (const product of response.data.items) {
				products.push(product.item);
			}
			hasMoreItems = response.additional_data?.next_cursor != null;
			cursor = response.additional_data?.next_cursor;
		} while (hasMoreItems);

		return {
			found: products.length > 0,
			data: products,
		};
	},
});
