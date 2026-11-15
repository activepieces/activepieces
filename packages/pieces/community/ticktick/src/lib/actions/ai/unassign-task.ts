import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ticktickAuth } from '../../auth';
import { tickTickApiCall } from '../../common/client';
import { ticktickCreateTaskOutputSchema } from '../../output-schemas';

export const unassignTaskAction = createAction({
	auth: ticktickAuth,
	name: 'ticktick_unassign_task',
	outputSchema: ticktickCreateTaskOutputSchema,
	displayName: 'Unassign Task',
	description: 'Removes the assignee from a task.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Removes the assignee from a task identified by projectId and taskId. Returns the updated task. Repeating it on an unassigned task is harmless.',
		idempotent: true,
	},
	props: {
		projectId: Property.ShortText({
			displayName: 'Project ID',
			description: 'The project containing the task.',
			required: true,
		}),
		taskId: Property.ShortText({
			displayName: 'Task ID',
			required: true,
		}),
	},
	async run(context) {
		const { projectId, taskId } = context.propsValue;
		return await tickTickApiCall({
			accessToken: context.auth.access_token,
			method: HttpMethod.POST,
			resourceUri: '/task/unassign',
			body: { projectId, taskId },
		});
	},
});
