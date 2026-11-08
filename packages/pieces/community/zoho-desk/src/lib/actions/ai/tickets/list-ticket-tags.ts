import { createAction } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListTicketTagsOutputSchema } from '../../../output-schemas';

export const zohoDeskListTicketTagsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_ticket_tags',
	outputSchema: zohoDeskListTicketTagsOutputSchema,
	displayName: 'List Ticket Tags',
	description: 'Lists the tags on a ticket.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: { description: 'Lists the tags currently on one ticket.', idempotent: true },
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		ticketId: zohoDeskAiProps.ticketId({ required: true }),
	},
	async run(context) {
		const { orgId, ticketId } = context.propsValue;
		return await zohoDeskApi.listTicketTags({ auth: context.auth, orgId, ticketId });
	},
});
