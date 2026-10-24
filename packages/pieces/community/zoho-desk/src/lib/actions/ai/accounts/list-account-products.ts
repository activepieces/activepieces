import { createAction } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListAccountProductsOutputSchema } from '../../../output-schemas';

export const zohoDeskListAccountProductsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_account_products',
	outputSchema: zohoDeskListAccountProductsOutputSchema,
	displayName: 'List Account Products',
	description: 'Lists the products linked to an account.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: { description: 'Lists the products linked to one account.', idempotent: true },
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		accountId: zohoDeskAiProps.accountId({ required: true }),
		departmentId: zohoDeskAiProps.departmentId({ required: false }),
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const { orgId, accountId, departmentId, from, limit } = context.propsValue;
		const products = await zohoDeskApi.listAccountProducts({
			auth: context.auth,
			orgId,
			accountId,
			departmentId,
			from,
			limit,
		});
		return { products, count: products.length };
	},
});
