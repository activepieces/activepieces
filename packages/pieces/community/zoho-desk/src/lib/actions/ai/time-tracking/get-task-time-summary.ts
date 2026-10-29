import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskGetAccountTimeSummaryOutputSchema } from '../../../output-schemas';

export const zohoDeskGetTaskTimeSummaryAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_get_task_time_summary',
	outputSchema: zohoDeskGetAccountTimeSummaryOutputSchema,
	displayName: 'Get Task Time Summary',
	description: 'Get Task Time Summary.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Returns the total time and cost logged on one task.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		taskId: zohoDeskAiProps.taskId({ required: true }),
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
		const { orgId, taskId, billStatus } = context.propsValue;
		return await zohoDeskApi.getTaskTimeSummary({ auth: context.auth, orgId, taskId, billStatus });
	},
});
