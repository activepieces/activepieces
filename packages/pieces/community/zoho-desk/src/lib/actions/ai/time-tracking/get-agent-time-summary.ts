import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskGetAccountTimeSummaryOutputSchema } from '../../../output-schemas';

export const zohoDeskGetAgentTimeSummaryAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_get_agent_time_summary',
	outputSchema: zohoDeskGetAccountTimeSummaryOutputSchema,
	displayName: 'Get Agent Time Summary',
	description: 'Get Agent Time Summary.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Returns the total time and cost one agent has logged.',
		idempotent: true,
	},
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
	},
	async run(context) {
		const { orgId, agentId, module, departmentId, billStatus } = context.propsValue;
		return await zohoDeskApi.getAgentTimeSummary({
			auth: context.auth,
			orgId,
			agentId,
			module,
			departmentId,
			billStatus,
		});
	},
});
