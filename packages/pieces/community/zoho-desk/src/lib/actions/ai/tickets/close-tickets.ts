import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUtils } from '../../../common/utils';
import { zohoDeskCloseTicketsOutputSchema } from '../../../output-schemas';

export const zohoDeskCloseTicketsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_close_tickets',
	outputSchema: zohoDeskCloseTicketsOutputSchema,
	displayName: 'Close Tickets',
	description: 'Closes one or more tickets.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Sets the status of one or more tickets to Closed in one call. Use Update Ticket for any other status.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		ticketIds: Property.Array({
			displayName: 'Ticket IDs',
			description: 'Ticket IDs to close.',
			required: true,
		}),
	},
	async run(context) {
		const { orgId, ticketIds } = context.propsValue;
		await zohoDeskApi.closeTickets({
			auth: context.auth,
			orgId,
			ticketIds: zohoDeskUtils.requiredStringList({ value: ticketIds, propName: 'Ticket IDs' }),
		});
		return { success: true, ticketIds };
	},
});
