import { createAction } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskDeleteTicketResolutionOutputSchema } from '../../../output-schemas';

export const zohoDeskDeleteTicketResolutionAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_delete_ticket_resolution',
	outputSchema: zohoDeskDeleteTicketResolutionOutputSchema,
	displayName: 'Delete Ticket Resolution',
	description: 'Removes the resolution note from a ticket.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description: 'Permanently removes the resolution note from one ticket.',
		idempotent: false,
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
		await zohoDeskApi.deleteTicketResolution({ auth: context.auth, orgId, ticketId });
		return { success: true, ticketId };
	},
});
