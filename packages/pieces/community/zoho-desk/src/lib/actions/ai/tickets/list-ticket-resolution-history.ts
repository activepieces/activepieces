import { createAction } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListTicketResolutionHistoryOutputSchema } from '../../../output-schemas';

export const zohoDeskListTicketResolutionHistoryAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_ticket_resolution_history',
	outputSchema: zohoDeskListTicketResolutionHistoryOutputSchema,
	displayName: 'List Ticket Resolution History',
	description: "Lists earlier versions of a ticket's resolution note.",
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			"Lists the earlier versions of one ticket's resolution note, with who changed it and when.",
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
		const history = await zohoDeskApi.listTicketResolutionHistory({
			auth: context.auth,
			orgId,
			ticketId,
			from,
			limit,
		});
		return { history, count: history.length };
	},
});
