import { createAction } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListTicketFollowersOutputSchema } from '../../../output-schemas';

export const zohoDeskListTicketFollowersAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_ticket_followers',
	outputSchema: zohoDeskListTicketFollowersOutputSchema,
	displayName: 'List Ticket Followers',
	description: 'Lists the agents following a ticket.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: { description: 'Lists the agents following one ticket.', idempotent: true },
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		ticketId: zohoDeskAiProps.ticketId({ required: true }),
	},
	async run(context) {
		const { orgId, ticketId } = context.propsValue;
		const followers = await zohoDeskApi.listTicketFollowers({
			auth: context.auth,
			orgId,
			ticketId,
		});
		return { followers, count: followers.length };
	},
});
