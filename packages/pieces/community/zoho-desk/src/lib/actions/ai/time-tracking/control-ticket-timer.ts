import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskGetTicketTimerOutputSchema } from '../../../output-schemas';

export const zohoDeskControlTicketTimerAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_control_ticket_timer',
	outputSchema: zohoDeskGetTicketTimerOutputSchema,
	displayName: 'Control Ticket Timer',
	description: 'Starts, pauses, resumes or stops the timer on a ticket.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Starts, pauses, resumes or stops the connected agent's timer on one ticket; stopping it logs a time entry. Not idempotent: the result depends on the timer's current state.",
		idempotent: false,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		ticketId: zohoDeskAiProps.ticketId({ required: true }),
		action: Property.StaticDropdown({
			displayName: 'Action',
			description: 'Timer action.',
			required: true,
			options: {
				disabled: false,
				options: [
					{ label: 'START', value: 'START' },
					{ label: 'PAUSE', value: 'PAUSE' },
					{ label: 'RESUME', value: 'RESUME' },
					{ label: 'STOP', value: 'STOP' },
				],
			},
		}),
	},
	async run(context) {
		const { orgId, ticketId, action } = context.propsValue;
		return await zohoDeskApi.controlTicketTimer({ auth: context.auth, orgId, ticketId, action });
	},
});
