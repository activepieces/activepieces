import { createAction } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskGetTicketResolutionOutputSchema } from '../../../output-schemas';

export const zohoDeskGetTicketResolutionAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_get_ticket_resolution',
	outputSchema: zohoDeskGetTicketResolutionOutputSchema,
	displayName: 'Get Ticket Resolution',
	description: 'Gets the resolution note of a ticket.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets the resolution note recorded on one ticket, with its author and last-modified time.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		ticketId: zohoDeskAiProps.ticketId({ required: true }),
	},
	async run(context) {
		const { orgId, ticketId } = context.propsValue;
		return await zohoDeskApi.getTicketResolution({ auth: context.auth, orgId, ticketId });
	},
});
