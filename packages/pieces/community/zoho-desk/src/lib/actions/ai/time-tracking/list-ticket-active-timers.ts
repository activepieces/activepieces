import { createAction } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListTicketActiveTimersOutputSchema } from '../../../output-schemas';

export const zohoDeskListTicketActiveTimersAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_ticket_active_timers',
	outputSchema: zohoDeskListTicketActiveTimersOutputSchema,
	displayName: 'List Ticket Active Timers',
	description: "Lists the agents' running timers on a ticket.",
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description: 'Lists the timers agents currently have running or paused on one ticket.',
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
		const timers = await zohoDeskApi.listTicketActiveTimers({
			auth: context.auth,
			orgId,
			ticketId,
			from,
			limit,
		});
		return { timers, count: timers.length };
	},
});
