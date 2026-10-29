import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskGetTicketCommentHistoryOutputSchema } from '../../../output-schemas';

export const zohoDeskGetTicketCommentHistoryAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_get_ticket_comment_history',
	outputSchema: zohoDeskGetTicketCommentHistoryOutputSchema,
	displayName: 'Get Ticket Comment History',
	description: 'Lists the edit history of a ticket comment.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description: 'Lists the earlier versions of one ticket comment, with who edited it and when.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		ticketId: zohoDeskAiProps.ticketId({ required: true }),
		commentId: Property.ShortText({
			displayName: 'Comment ID',
			description: 'Comment ID (from List Ticket Comments).',
			required: true,
		}),
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const { orgId, ticketId, commentId, from, limit } = context.propsValue;
		const history = await zohoDeskApi.getTicketCommentHistory({
			auth: context.auth,
			orgId,
			ticketId,
			commentId,
			from,
			limit,
		});
		return { history, count: history.length };
	},
});
