import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { ticktickAuth } from '../auth';
import { tickTickApiCall } from '../common/client';
import { projectId, taskId } from '../common/props';

export const deleteTaskAction = createAction({
	auth: ticktickAuth,
	name: 'delete_task',
	displayName: 'Delete Task',
	description: 'Deletes an existing task.',
	audience: 'both',
	aiMetadata: {
		description:
			'Permanently deletes a TickTick task identified by its list (project) ID and task ID. Use to remove a task you no longer need; this is destructive and cannot be undone. Idempotent on the end state: re-deleting the same task leaves it gone.',
		idempotent: true,
	},
	props: {
		projectId: projectId({
			displayName: 'List',
			description: 'The list the task belongs to.',
			required: true,
		}),
		taskId: taskId({
			displayName: 'Task ID',
			description: 'The ID of the task to delete.',
			required: true,
		}),
	},
	async run(context) {
		const { projectId, taskId } = context.propsValue;

		const response = await tickTickApiCall({
			accessToken: context.auth.access_token,
			method: HttpMethod.DELETE,
			resourceUri: `/project/${projectId}/task/${taskId}`,
		});

		return response;
	},
});
