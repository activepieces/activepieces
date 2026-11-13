import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskGetTicketOutputSchema } from '../../../output-schemas';

export const zohoDeskGetTicketAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_get_ticket',
	outputSchema: zohoDeskGetTicketOutputSchema,
	displayName: 'Get Ticket',
	description: 'Gets a ticket by ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets one ticket by its ID with all fields, including status, assignee, contact, department and custom fields (`cf`). To find a ticket by its number (e.g. "#123"), use Search Tickets with Ticket Number.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		ticketId: zohoDeskAiProps.ticketId({ required: true }),
		include: Property.StaticMultiSelectDropdown({
			displayName: 'Include',
			description: 'Related data to embed in the ticket.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'contacts', value: 'contacts' },
					{ label: 'products', value: 'products' },
					{ label: 'assignee', value: 'assignee' },
					{ label: 'departments', value: 'departments' },
					{ label: 'contract', value: 'contract' },
					{ label: 'isRead', value: 'isRead' },
					{ label: 'team', value: 'team' },
					{ label: 'skills', value: 'skills' },
				],
			},
		}),
	},
	async run(context) {
		const { orgId, ticketId, include } = context.propsValue;
		return await zohoDeskApi.getTicket({ auth: context.auth, orgId, ticketId, include });
	},
});
