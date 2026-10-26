import { createAction } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListProductTicketsOutputSchema } from '../../../output-schemas';

export const zohoDeskListProductTicketsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_product_tickets',
	outputSchema: zohoDeskListProductTicketsOutputSchema,
	displayName: 'List Product Tickets',
	description: 'Lists the tickets about a product.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description: 'Lists the tickets linked to one product, optionally only in one department.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		productId: zohoDeskAiProps.productId({ required: true }),
		departmentId: zohoDeskAiProps.departmentId({ required: false }),
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const { orgId, productId, departmentId, from, limit } = context.propsValue;
		const tickets = await zohoDeskApi.listProductTickets({
			auth: context.auth,
			orgId,
			productId,
			departmentId,
			from,
			limit,
		});
		return { tickets, count: tickets.length };
	},
});
