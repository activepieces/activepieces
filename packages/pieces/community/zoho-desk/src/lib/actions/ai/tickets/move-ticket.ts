import { createAction } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskMoveTicketOutputSchema } from '../../../output-schemas';

export const zohoDeskMoveTicketAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_move_ticket',
	outputSchema: zohoDeskMoveTicketOutputSchema,
	displayName: 'Move Ticket',
	description: 'Moves a ticket to another department.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Moves one ticket to another department (from List Departments). Moving to the department it is already in changes nothing.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		ticketId: zohoDeskAiProps.ticketId({ required: true }),
		departmentId: zohoDeskAiProps.departmentId({
			required: true,
			description: 'Department to move the ticket to (from List Departments).',
		}),
	},
	async run(context) {
		const { orgId, ticketId, departmentId } = context.propsValue;
		await zohoDeskApi.moveTicket({ auth: context.auth, orgId, ticketId, departmentId });
		return { success: true, ticketId, departmentId };
	},
});
