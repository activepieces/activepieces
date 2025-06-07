import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { ticktickAuth } from '../../index';
import { tickTickApiCall } from '../common/client';
import { projectId, taskId } from '../common/props';

export const getTaskAction = createAction({
	auth: ticktickAuth,
	name: 'get_task',
	displayName: 'Get Task',
	description: 'Retrieves the details of a specific task.',
	props: {
		projectId: projectId({
			displayName: 'List',
			description: 'The list the task belongs to.',
			required: true,
		}),
		taskId: taskId({
			displayName: 'Task ID',
			description: 'The ID of the task to retrieve.',
			required: true,
		}),
	},
	async run(context) {
		const { projectId, taskId } = context.propsValue;

		const response = await tickTickApiCall({
			accessToken: context.auth.access_token,
			method: HttpMethod.GET,
			resourceUri: `/project/${projectId}/task/${taskId}`,
		});

		return response;
	},
});
