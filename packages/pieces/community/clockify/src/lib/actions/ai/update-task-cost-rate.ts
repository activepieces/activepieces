import { createAction } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { taskOutputSchema } from '../../output-schemas';

export const updateTaskCostRateAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_update_task_cost_rate',
	outputSchema: taskOutputSchema,
	displayName: 'Update Task Cost Rate',
	description: 'Sets the cost rate of a task.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Sets the cost rate of one task, in cents, overriding the project and user rates for time on that task. Needs workspace admin and a Clockify plan with cost rates (Pro or higher). Returns the updated task.',
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
		return await clockifyApi.updateTaskCostRate({
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
