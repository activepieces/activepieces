import { createAction } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskGetTicketTimerOutputSchema } from '../../../output-schemas';

export const zohoDeskGetTicketTimerAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_get_ticket_timer',
	outputSchema: zohoDeskGetTicketTimerOutputSchema,
	displayName: 'Get Ticket Timer',
	description: "Gets the connected agent's timer on a ticket.",
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			"Gets the state (running, paused, stopped) and elapsed time of the connected agent's timer on one ticket.",
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		ticketId: zohoDeskAiProps.ticketId({ required: true }),
	},
	async run(context) {
		const { orgId, ticketId } = context.propsValue;
		return await zohoDeskApi.getTicketTimer({ auth: context.auth, orgId, ticketId });
	},
});
