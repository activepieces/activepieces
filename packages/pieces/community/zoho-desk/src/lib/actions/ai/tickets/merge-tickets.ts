import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUtils } from '../../../common/utils';
import { createTicketOutputSchema } from '../../../output-schemas';

export const zohoDeskMergeTicketsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_merge_tickets',
	outputSchema: createTicketOutputSchema,
	displayName: 'Merge Tickets',
	description: 'Merges other tickets into one ticket.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Merges the listed tickets into the target ticket, combining their threads, comments and attachments; the merged tickets are removed. This cannot be undone.',
		idempotent: false,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		ticketId: Property.ShortText({
			displayName: 'Target Ticket ID',
			description: 'ID of the ticket the others are merged into.',
			required: true,
		}),
		ticketIds: Property.Array({
			displayName: 'Ticket IDs',
			description: 'IDs of the tickets to merge into the target ticket.',
			required: true,
		}),
	},
	async run(context) {
		const { orgId, ticketId, ticketIds } = context.propsValue;
		return await zohoDeskApi.mergeTickets({
			auth: context.auth,
			orgId,
			ticketId,
			ticketIds: zohoDeskUtils.requiredStringList({ value: ticketIds, propName: 'Ticket IDs' }),
		});
	},
});
