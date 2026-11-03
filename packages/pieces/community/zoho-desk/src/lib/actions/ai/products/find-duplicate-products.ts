import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListAccountProductsOutputSchema } from '../../../output-schemas';

export const zohoDeskFindDuplicateProductsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_find_duplicate_products',
	outputSchema: zohoDeskListAccountProductsOutputSchema,
	displayName: 'Find Duplicate Products',
	description: 'Finds products with the same name.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Finds existing products whose name matches Product Name; use it before Create Product to avoid duplicates.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		productName: Property.ShortText({
			displayName: 'Product Name',
			description: 'Product name to check.',
			required: true,
		}),
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const { orgId, productName, from, limit } = context.propsValue;
		const products = await zohoDeskApi.findDuplicateProducts({
			auth: context.auth,
			orgId,
			productName,
			from,
			limit,
		});
		return { products, count: products.length };
	},
});
