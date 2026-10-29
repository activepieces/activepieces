import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListAccountTimeEntriesOutputSchema } from '../../../output-schemas';

export const zohoDeskListAgentTimeEntriesAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_agent_time_entries',
	outputSchema: zohoDeskListAccountTimeEntriesOutputSchema,
	displayName: 'List Agent Time Entries',
	description: 'List Agent Time Entries.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: { description: 'Lists the time entries one agent has logged.', idempotent: true },
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		agentId: zohoDeskAiProps.agentId({ required: true }),
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
		departmentId: zohoDeskAiProps.departmentId({ required: false }),
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
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const { orgId, agentId, module, departmentId, billStatus, from, limit } = context.propsValue;
		const timeEntries = await zohoDeskApi.listAgentTimeEntries({
			auth: context.auth,
			orgId,
			agentId,
			module,
			departmentId,
			billStatus,
			from,
			limit,
		});
		return { timeEntries, count: timeEntries.length };
	},
});
