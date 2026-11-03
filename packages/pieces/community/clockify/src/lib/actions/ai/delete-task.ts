import { createAction } from '@activepieces/pieces-framework';

import { clockifyAuth } from '../../auth';
import { clockifyAiProps } from '../../common/ai-props';
import { clockifyApi } from '../../common/api';
import { taskOutputSchema } from '../../output-schemas';

export const deleteTaskAction = createAction({
	auth: clockifyAuth,
	name: 'clockify_delete_task',
	outputSchema: taskOutputSchema,
	displayName: 'Delete Task',
	description: 'Deletes a task marked Done.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes a task from a project. Clockify only deletes tasks marked Done, so set its status to Done with Update Task first. Time entries on it keep their project but lose the task.',
		idempotent: false,
	},
	props: {
		workspaceId: clockifyAiProps.workspaceId({ required: true }),
		projectId: clockifyAiProps.projectId({ required: true }),
		taskId: clockifyAiProps.taskId({ required: true }),
	},
	async run({ auth, propsValue }) {
		return await clockifyApi.deleteTask({
			auth,
			workspaceId: propsValue.workspaceId,
			projectId: propsValue.projectId,
			taskId: propsValue.taskId,
		});
	},
});
