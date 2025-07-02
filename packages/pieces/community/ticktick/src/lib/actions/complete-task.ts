import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { ticktickAuth } from '../../index';
import { tickTickApiCall } from '../common/client';
import { projectId, taskId } from '../common/props';

export const completeTaskAction = createAction({
	auth: ticktickAuth,
	name: 'complete_task',
	displayName: 'Complete Task',
	description: 'Marks an existing task as completed.',
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
