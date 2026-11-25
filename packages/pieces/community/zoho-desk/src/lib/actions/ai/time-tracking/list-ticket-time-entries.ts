import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListAccountTimeEntriesOutputSchema } from '../../../output-schemas';

export const zohoDeskListTicketTimeEntriesAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_ticket_time_entries',
	outputSchema: zohoDeskListAccountTimeEntriesOutputSchema,
	displayName: 'List Ticket Time Entries',
	description: 'List Ticket Time Entries.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the time entries logged on one ticket and, with Module, on its tasks, calls or events.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		ticketId: zohoDeskAiProps.ticketId({ required: true }),
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
		createdTimeRange: Property.ShortText({
			displayName: 'Created Time Range',
			description:
				'Two ISO 8601 times separated by a comma, e.g. "2024-01-01T00:00:00.000Z,2024-01-31T23:59:59.000Z".',
			required: false,
		}),
		modifiedTimeRange: Property.ShortText({
			displayName: 'Modified Time Range',
			description:
				'Two ISO 8601 times separated by a comma, e.g. "2024-01-01T00:00:00.000Z,2024-01-31T23:59:59.000Z".',
			required: false,
		}),
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const {
			orgId,
			ticketId,
			billStatus,
			module,
			createdTimeRange,
			modifiedTimeRange,
			from,
			limit,
		} = context.propsValue;
		const timeEntries = await zohoDeskApi.listTicketTimeEntries({
			auth: context.auth,
			orgId,
			ticketId,
			billStatus,
			module,
			createdTimeRange,
			modifiedTimeRange,
			from,
			limit,
		});
		return { timeEntries, count: timeEntries.length };
	},
});
