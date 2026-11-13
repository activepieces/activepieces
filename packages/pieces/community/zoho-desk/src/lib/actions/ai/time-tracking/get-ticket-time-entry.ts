import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskGetAgentTimeEntryOutputSchema } from '../../../output-schemas';

export const zohoDeskGetTicketTimeEntryAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_get_ticket_time_entry',
	outputSchema: zohoDeskGetAgentTimeEntryOutputSchema,
	displayName: 'Get Ticket Time Entry',
	description: 'Gets one time entry on a ticket.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets one time entry on a ticket with its duration, owner, billing and cost.',
		idempotent: true,
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
		return await zohoDeskApi.getTicketTimeEntry({
			auth: context.auth,
			orgId,
			ticketId,
			timeEntryId,
		});
	},
});
