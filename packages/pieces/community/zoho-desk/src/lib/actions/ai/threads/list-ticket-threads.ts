import { createAction } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListTicketThreadsOutputSchema } from '../../../output-schemas';

export const zohoDeskListTicketThreadsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_ticket_threads',
	outputSchema: zohoDeskListTicketThreadsOutputSchema,
	displayName: 'List Ticket Threads',
	description: 'Lists the email and channel threads on a ticket.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			"Lists the threads (emails and channel messages) on one ticket, with a summary of each. Use Get Ticket Thread for a thread's full content and attachments.",
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
		const threads = await zohoDeskApi.listTicketThreads({
			auth: context.auth,
			orgId,
			ticketId,
			from,
			limit,
		});
		return { threads, count: threads.length };
	},
});
