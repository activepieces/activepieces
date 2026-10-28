import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskCreateTicketPinOutputSchema } from '../../../output-schemas';

export const zohoDeskCreateTicketPinAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_create_ticket_pin',
	outputSchema: zohoDeskCreateTicketPinOutputSchema,
	displayName: 'Pin To Ticket',
	description: 'Pins a comment or thread on a ticket.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Pins one comment (from List Ticket Comments) or thread (from List Ticket Threads) to the top of a ticket.',
		idempotent: false,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		ticketId: zohoDeskAiProps.ticketId({ required: true }),
		entityId: Property.ShortText({
			displayName: 'Comment or Thread ID',
			description: 'ID of the comment or thread to pin.',
			required: true,
		}),
		type: Property.StaticDropdown({
			displayName: 'Type',
			description: 'Whether Comment or Thread ID is a comment or a thread.',
			required: true,
			options: {
				disabled: false,
				options: [
					{ label: 'COMMENTS', value: 'COMMENTS' },
					{ label: 'THREADS', value: 'THREADS' },
				],
			},
		}),
		isPublic: zohoDeskAiProps.yesNo({
			required: false,
			displayName: 'Is Public',
			description: 'Yes shows the pin to the contact in the help center.',
		}),
	},
	async run(context) {
		const { orgId, ticketId, entityId, type, isPublic } = context.propsValue;
		return await zohoDeskApi.createTicketPin({
			auth: context.auth,
			orgId,
			ticketId,
			entityId,
			type,
			isPublic,
		});
	},
});
