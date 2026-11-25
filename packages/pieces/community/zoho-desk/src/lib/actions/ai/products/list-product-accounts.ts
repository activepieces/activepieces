import { createAction } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListAccountsOutputSchema } from '../../../output-schemas';

export const zohoDeskListProductAccountsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_product_accounts',
	outputSchema: zohoDeskListAccountsOutputSchema,
	displayName: 'List Product Accounts',
	description: 'Lists the accounts linked to a product.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: { description: 'Lists the accounts linked to one product.', idempotent: true },
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		productId: zohoDeskAiProps.productId({ required: true }),
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const { orgId, productId, from, limit } = context.propsValue;
		const accounts = await zohoDeskApi.listProductAccounts({
			auth: context.auth,
			orgId,
			productId,
			from,
			limit,
		});
		return { accounts, count: accounts.length };
	},
});
