import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskSearchProductsOutputSchema } from '../../../output-schemas';

export const zohoDeskSearchProductsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_search_products',
	outputSchema: zohoDeskSearchProductsOutputSchema,
	displayName: 'Search Products',
	description: 'Searches products by text or name.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Searches products by free text (supports a trailing * wildcard), product name, linked contact or account, or time range. Page with From and Limit.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		searchText: Property.ShortText({
			displayName: 'Search Text',
			description: 'Free text matched across product fields; end with * for a prefix match.',
			required: false,
		}),
		productName: Property.ShortText({
			displayName: 'Product Name',
			description: 'Product name.',
			required: false,
		}),
		departmentId: zohoDeskAiProps.departmentId({ required: false }),
		contactId: zohoDeskAiProps.contactId({ required: false }),
		accountId: zohoDeskAiProps.accountId({ required: false }),
		createdTimeRange: Property.ShortText({
			displayName: 'Created Time Range',
			description:
				'Two ISO 8601 times separated by a comma, e.g. "2024-01-01T00:00:00.000Z,2024-01-31T23:59:59.000Z".',
			required: false,
		}),
		modifiedTimeRange: Property.ShortText({
			displayName: 'Modified Time Range',
			description:
				'Two ISO 8601 times separated by a comma, e.g. "2024-01-01T00:00:00.000Z,2024-01-31T23:59:59.000Z".',
			required: false,
		}),
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const {
			orgId,
			searchText,
			productName,
			departmentId,
			contactId,
			accountId,
			createdTimeRange,
			modifiedTimeRange,
			from,
			limit,
		} = context.propsValue;
		const products = await zohoDeskApi.searchProducts({
			auth: context.auth,
			orgId,
			searchText,
			productName,
			departmentId,
			contactId,
			accountId,
			createdTimeRange,
			modifiedTimeRange,
			from,
			limit,
		});
		return { products, count: products.length };
	},
});
