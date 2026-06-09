import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { ticktickAuth } from '../auth';
import { tickTickApiCall } from '../common/client';
import { projectId, taskId } from '../common/props';

export const completeTaskAction = createAction({
	auth: ticktickAuth,
	name: 'complete_task',
	displayName: 'Complete Task',
	description: 'Marks an existing task as completed.',
	audience: 'both',
	aiMetadata: {
		description:
			'Marks a TickTick task as completed, identified by its list (project) ID and task ID. Use to close out a task. Idempotent: completing an already-completed task leaves it completed with no further effect.',
		idempotent: true,
	},
	props: {
		projectId: projectId({
			displayName: 'List',
			required: true,
		}),
		taskId: taskId({
			displayName: 'Task ID',
			description: 'The ID of the task to complete.',
			required: true,
		}),
	},
	async run(context) {
		const { projectId, taskId } = context.propsValue;

		const response = await tickTickApiCall({
			accessToken: context.auth.access_token,
			method: HttpMethod.POST,
			resourceUri: `/project/${projectId}/task/${taskId}/complete`,
		});

		return response;
	},
});
