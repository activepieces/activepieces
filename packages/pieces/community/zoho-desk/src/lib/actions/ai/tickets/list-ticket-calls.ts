import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListTicketCallsOutputSchema } from '../../../output-schemas';

export const zohoDeskListTicketCallsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_ticket_calls',
	outputSchema: zohoDeskListTicketCallsOutputSchema,
	displayName: 'List Ticket Calls',
	description: 'Lists the calls logged on a ticket.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: { description: 'Lists the calls logged on one ticket.', idempotent: true },
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		ticketId: zohoDeskAiProps.ticketId({ required: true }),
		isCompleted: zohoDeskAiProps.yesNo({
			required: false,
			displayName: 'Is Completed',
			description: 'Yes returns only completed calls, No only open ones.',
		}),
		sortBy: Property.StaticDropdown({
			displayName: 'Sort By',
			description: 'Sort field.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'startTime', value: 'startTime' },
					{ label: 'createdTime', value: 'createdTime' },
				],
			},
		}),
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const { orgId, ticketId, isCompleted, sortBy, from, limit } = context.propsValue;
		const calls = await zohoDeskApi.listTicketCalls({
			auth: context.auth,
			orgId,
			ticketId,
			isCompleted,
			sortBy,
			from,
			limit,
		});
		return { calls, count: calls.length };
	},
});
