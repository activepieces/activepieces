import { createAction } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskGetTicketMetricsOutputSchema } from '../../../output-schemas';

export const zohoDeskGetTicketMetricsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_get_ticket_metrics',
	outputSchema: zohoDeskGetTicketMetricsOutputSchema,
	displayName: 'Get Ticket Metrics',
	description: 'Gets response and resolution metrics for a ticket.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			"Gets one ticket's metrics: first response time, total response time, resolution time, response and reassign counts, reopen count and agents who handled it.",
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
		return await zohoDeskApi.getTicketMetrics({ auth: context.auth, orgId, ticketId });
	},
});
