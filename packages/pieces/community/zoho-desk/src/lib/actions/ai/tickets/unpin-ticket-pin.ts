import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUtils } from '../../../common/utils';
import { zohoDeskAssociateAccountProductsOutputSchema } from '../../../output-schemas';

export const zohoDeskUnpinTicketPinAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_unpin_ticket_pin',
	outputSchema: zohoDeskAssociateAccountProductsOutputSchema,
	displayName: 'Unpin From Ticket',
	description: 'Removes pins from a ticket.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description: 'Removes pins (the pin `id` from List Ticket Pins) from one ticket.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		ticketId: zohoDeskAiProps.ticketId({ required: true }),
		pinIds: Property.Array({
			displayName: 'Pin IDs',
			description: 'Pin IDs to remove (from List Ticket Pins).',
			required: true,
		}),
	},
	async run(context) {
		const { orgId, ticketId, pinIds } = context.propsValue;
		return await zohoDeskApi.unpinTicketPin({
			auth: context.auth,
			orgId,
			ticketId,
			pinIds: zohoDeskUtils.requiredStringList({ value: pinIds, propName: 'Pin IDs' }),
		});
	},
});
