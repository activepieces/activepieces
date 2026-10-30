import { createAction } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListTicketConversationsOutputSchema } from '../../../output-schemas';

export const zohoDeskListTicketConversationsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_ticket_conversations',
	outputSchema: zohoDeskListTicketConversationsOutputSchema,
	displayName: 'List Ticket Conversations',
	description: 'Lists the threads and comments on a ticket in one timeline.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			"Lists one ticket's threads and comments together in time order, the whole conversation in one call.",
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
		const conversations = await zohoDeskApi.listTicketConversations({
			auth: context.auth,
			orgId,
			ticketId,
			from,
			limit,
		});
		return { conversations, count: conversations.length };
	},
});
