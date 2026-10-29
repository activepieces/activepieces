import { createAction } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListAccountProductsOutputSchema } from '../../../output-schemas';

export const zohoDeskListContactProductsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_contact_products',
	outputSchema: zohoDeskListAccountProductsOutputSchema,
	displayName: 'List Contact Products',
	description: 'Lists the products linked to a contact.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: { description: 'Lists the products linked to one contact.', idempotent: true },
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		contactId: zohoDeskAiProps.contactId({ required: true }),
		departmentId: zohoDeskAiProps.departmentId({ required: false }),
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const { orgId, contactId, departmentId, from, limit } = context.propsValue;
		const products = await zohoDeskApi.listContactProducts({
			auth: context.auth,
			orgId,
			contactId,
			departmentId,
			from,
			limit,
		});
		return { products, count: products.length };
	},
});
