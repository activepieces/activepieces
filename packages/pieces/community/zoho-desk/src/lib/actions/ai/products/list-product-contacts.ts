import { createAction } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListProductContactsOutputSchema } from '../../../output-schemas';

export const zohoDeskListProductContactsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_product_contacts',
	outputSchema: zohoDeskListProductContactsOutputSchema,
	displayName: 'List Product Contacts',
	description: 'Lists the contacts linked to a product.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: { description: 'Lists the contacts linked to one product.', idempotent: true },
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
		const contacts = await zohoDeskApi.listProductContacts({
			auth: context.auth,
			orgId,
			productId,
			from,
			limit,
		});
		return { contacts, count: contacts.length };
	},
});
