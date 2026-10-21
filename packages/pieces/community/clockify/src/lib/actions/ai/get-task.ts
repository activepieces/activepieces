import { createAction } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { taskOutputSchema } from '../../output-schemas';

export const getTaskAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_get_task',
	outputSchema: taskOutputSchema,
	displayName: 'Get Task',
	description: 'Gets a task by ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Returns one task of a Clockify project by ID: name, status, assignees, estimate, billable flag and rates.',
		idempotent: true,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		projectId: clockifyAiProps.projectId({ required: true }),
		taskId: clockifyAiProps.taskId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await clockifyApi.getTask({
			auth,
			workspaceId: propsValue.workspaceId,
			projectId: propsValue.projectId,
			taskId: propsValue.taskId,
		});
	},
});
