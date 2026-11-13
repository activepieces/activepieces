import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskDeleteTicketTimeEntryOutputSchema } from '../../../output-schemas';

export const zohoDeskDeleteTicketTimeEntryAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_delete_ticket_time_entry',
	outputSchema: zohoDeskDeleteTicketTimeEntryOutputSchema,
	displayName: 'Delete Ticket Time Entry',
	description: 'Deletes a time entry from a ticket.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description: 'Permanently deletes one time entry from a ticket.',
		idempotent: false,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		ticketId: zohoDeskAiProps.ticketId({ required: true }),
		timeEntryId: Property.ShortText({
			displayName: 'Time Entry ID',
			description: 'Time entry ID (from the matching List Time Entries action).',
			required: true,
		}),
	},
	async run(context) {
		const { orgId, ticketId, timeEntryId } = context.propsValue;
		await zohoDeskApi.deleteTicketTimeEntry({ auth: context.auth, orgId, ticketId, timeEntryId });
		return { success: true, ticketId, timeEntryId };
	},
});
