import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListAccountProductsOutputSchema } from '../../../output-schemas';

export const zohoDeskListProductsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_products',
	outputSchema: zohoDeskListAccountProductsOutputSchema,
	displayName: 'List Products',
	description: 'Lists products.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description: 'Lists products, optionally in one department or view. Page with From and Limit.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		departmentId: zohoDeskAiProps.departmentId({ required: false }),
		viewId: Property.ShortText({
			displayName: 'View ID',
			description: 'Product view ID (from List Views, module products).',
			required: false,
		}),
		ownerId: Property.ShortText({
			displayName: 'Owner ID',
			description: 'Only products owned by this agent.',
			required: false,
		}),
		sortBy: Property.StaticDropdown({
			displayName: 'Sort By',
			description: 'Field to sort by; a leading "-" sorts descending.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'productName', value: 'productName' },
					{ label: '-productName', value: '-productName' },
					{ label: 'productCode', value: 'productCode' },
					{ label: '-productCode', value: '-productCode' },
					{ label: 'unitPrice', value: 'unitPrice' },
					{ label: '-unitPrice', value: '-unitPrice' },
					{ label: 'createdTime', value: 'createdTime' },
					{ label: '-createdTime', value: '-createdTime' },
					{ label: 'modifiedTime', value: 'modifiedTime' },
					{ label: '-modifiedTime', value: '-modifiedTime' },
				],
			},
		}),
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const { orgId, departmentId, viewId, ownerId, sortBy, from, limit } = context.propsValue;
		const products = await zohoDeskApi.listProducts({
			auth: context.auth,
			orgId,
			departmentId,
			viewId,
			ownerId,
			sortBy,
			from,
			limit,
		});
		return { products, count: products.length };
	},
});
