import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUtils } from '../../../common/utils';
import { zohoDeskCloseTicketsOutputSchema } from '../../../output-schemas';

export const zohoDeskDeleteTicketsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_delete_tickets',
	outputSchema: zohoDeskCloseTicketsOutputSchema,
	displayName: 'Delete Tickets',
	description: 'Moves tickets to the recycle bin.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Moves one or more tickets to the recycle bin, where an admin can still restore them. Repeating the call on already-deleted tickets changes nothing.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		ticketIds: Property.Array({
			displayName: 'Ticket IDs',
			description: 'Ticket IDs to delete (from List Tickets or Search Tickets).',
			required: true,
		}),
	},
	async run(context) {
		const { orgId, ticketIds } = context.propsValue;
		await zohoDeskApi.deleteTickets({
			auth: context.auth,
			orgId,
			ticketIds: zohoDeskUtils.requiredStringList({ value: ticketIds, propName: 'Ticket IDs' }),
		});
		return { success: true, ticketIds };
	},
});
