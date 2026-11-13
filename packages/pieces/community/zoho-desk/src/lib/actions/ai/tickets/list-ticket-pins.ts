import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListTicketPinsOutputSchema } from '../../../output-schemas';

export const zohoDeskListTicketPinsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_ticket_pins',
	outputSchema: zohoDeskListTicketPinsOutputSchema,
	displayName: 'List Ticket Pins',
	description: 'Lists the pinned comments and threads on a ticket.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the comments and threads pinned on one ticket. The pin `id` is what Unpin Ticket Pin takes.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		ticketId: zohoDeskAiProps.ticketId({ required: true }),
		types: Property.StaticMultiSelectDropdown({
			displayName: 'Types',
			description: 'Only pins of these types.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'comments', value: 'comments' },
					{ label: 'threads', value: 'threads' },
				],
			},
		}),
	},
	async run(context) {
		const { orgId, ticketId, types } = context.propsValue;
		const pins = await zohoDeskApi.listTicketPins({ auth: context.auth, orgId, ticketId, types });
		return { pins, count: pins.length };
	},
});
