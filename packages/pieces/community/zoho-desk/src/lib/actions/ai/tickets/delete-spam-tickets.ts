import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUtils } from '../../../common/utils';
import { zohoDeskAssociateAccountProductsOutputSchema } from '../../../output-schemas';

export const zohoDeskDeleteSpamTicketsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_delete_spam_tickets',
	outputSchema: zohoDeskAssociateAccountProductsOutputSchema,
	displayName: 'Delete Spam Tickets',
	description: 'Permanently deletes tickets that are marked as spam.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes tickets that are already marked as spam (see Mark Tickets Spam). This cannot be undone.',
		idempotent: false,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		ticketIds: Property.Array({
			displayName: 'Ticket IDs',
			description: 'IDs of spam tickets to delete.',
			required: true,
		}),
	},
	async run(context) {
		const { orgId, ticketIds } = context.propsValue;
		return await zohoDeskApi.deleteSpamTickets({
			auth: context.auth,
			orgId,
			ticketIds: zohoDeskUtils.requiredStringList({ value: ticketIds, propName: 'Ticket IDs' }),
		});
	},
});
