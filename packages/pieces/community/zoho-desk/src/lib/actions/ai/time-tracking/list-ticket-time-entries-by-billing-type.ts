import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListTicketTimeEntriesByBillingTypeOutputSchema } from '../../../output-schemas';

export const zohoDeskListTicketTimeEntriesByBillingTypeAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_ticket_time_entries_by_billing_type',
	outputSchema: zohoDeskListTicketTimeEntriesByBillingTypeOutputSchema,
	displayName: 'List Ticket Time Entries By Billing Type',
	description: 'List Ticket Time Entries By Billing Type.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description: "Lists one ticket's time entries priced under one billing model.",
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		ticketId: zohoDeskAiProps.ticketId({ required: true }),
		billingType: Property.StaticDropdown({
			displayName: 'Billing Type',
			description: 'Billing model to list entries for.',
			required: true,
			options: {
				disabled: false,
				options: [
					{ label: 'FIXED_COST_FOR_TICKETS', value: 'FIXED_COST_FOR_TICKETS' },
					{ label: 'FIXED_COST_FOR_AGENTS', value: 'FIXED_COST_FOR_AGENTS' },
					{ label: 'SPECIFIC_COST_PER_PROFILE', value: 'SPECIFIC_COST_PER_PROFILE' },
					{ label: 'SPECIFIC_COST_PER_AGENT', value: 'SPECIFIC_COST_PER_AGENT' },
				],
			},
		}),
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const { orgId, ticketId, billingType, from, limit } = context.propsValue;
		const timeEntries = await zohoDeskApi.listTicketTimeEntriesByBillingType({
			auth: context.auth,
			orgId,
			ticketId,
			billingType,
			from,
			limit,
		});
		return { timeEntries, count: timeEntries.length };
	},
});
