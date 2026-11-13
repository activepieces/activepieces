import { createAction } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListTicketCommentsOutputSchema } from '../../../output-schemas';

export const zohoDeskListTicketCommentsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_ticket_comments',
	outputSchema: zohoDeskListTicketCommentsOutputSchema,
	displayName: 'List Ticket Comments',
	description: 'Lists the internal and public comments on a ticket.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description: 'Lists the comments on one ticket, both private (agent-only) and public.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		ticketId: zohoDeskAiProps.ticketId({ required: true }),
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const { orgId, ticketId, from, limit } = context.propsValue;
		const comments = await zohoDeskApi.listTicketComments({
			auth: context.auth,
			orgId,
			ticketId,
			from,
			limit,
		});
		return { comments, count: comments.length };
	},
});
