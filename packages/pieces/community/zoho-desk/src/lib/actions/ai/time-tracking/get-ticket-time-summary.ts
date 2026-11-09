import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskGetAccountTimeSummaryOutputSchema } from '../../../output-schemas';

export const zohoDeskGetTicketTimeSummaryAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_get_ticket_time_summary',
	outputSchema: zohoDeskGetAccountTimeSummaryOutputSchema,
	displayName: 'Get Ticket Time Summary',
	description: 'Get Ticket Time Summary.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Returns the total time (hours, minutes, seconds) and cost logged on one ticket.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		ticketId: zohoDeskAiProps.ticketId({ required: true }),
		module: Property.StaticDropdown({
			displayName: 'Module',
			description: 'Only entries logged on this kind of record.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'tickets', value: 'tickets' },
					{ label: 'tasks', value: 'tasks' },
					{ label: 'calls', value: 'calls' },
					{ label: 'events', value: 'events' },
				],
			},
		}),
		billStatus: Property.StaticDropdown({
			displayName: 'Bill Status',
			description: 'Only entries with this billing status.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'billable', value: 'billable' },
					{ label: 'nonBillable', value: 'nonBillable' },
					{ label: 'billed', value: 'billed' },
				],
			},
		}),
	},
	async run(context) {
		const { orgId, ticketId, module, billStatus } = context.propsValue;
		return await zohoDeskApi.getTicketTimeSummary({
			auth: context.auth,
			orgId,
			ticketId,
			module,
			billStatus,
		});
	},
});
