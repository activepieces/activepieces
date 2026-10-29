import { createAction } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskDeleteTicketResolutionOutputSchema } from '../../../output-schemas';

export const zohoDeskMarkTicketUnreadAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_mark_ticket_unread',
	outputSchema: zohoDeskDeleteTicketResolutionOutputSchema,
	displayName: 'Mark Ticket Unread',
	description: 'Marks a ticket as unread for the connected agent.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Marks one ticket as unread for the connected agent only.',
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
		await zohoDeskApi.markTicketUnread({ auth: context.auth, orgId, ticketId });
		return { success: true, ticketId };
	},
});
