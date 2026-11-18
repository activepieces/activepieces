import { createAction } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { taskOutputSchema } from '../../output-schemas';

export const updateTaskBillableRateAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_update_task_billable_rate',
	outputSchema: taskOutputSchema,
	displayName: 'Update Task Billable Rate',
	description: 'Sets the billable rate of a task.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Sets the billable rate of one task, in cents, overriding the project and user rates for time on that task. Needs workspace admin. Returns the updated task.',
		idempotent: true,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		projectId: clockifyAiProps.projectId({ required: true }),
		taskId: clockifyAiProps.taskId({ required: true }),
		amount: clockifyAiProps.rateAmount({ required: true }),
		since: clockifyAiProps.rateSince({ required: false }),
		includeApproved: clockifyAiProps.includeApproved({ required: false }),
	},
	async run({ auth, propsValue }) {
		return await clockifyApi.updateTaskBillableRate({
			auth,
			workspaceId: propsValue.workspaceId,
			projectId: propsValue.projectId,
			taskId: propsValue.taskId,
			amount: propsValue.amount,
			since: propsValue.since,
			includeApproved: propsValue.includeApproved,
		});
	},
});
