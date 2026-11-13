import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ticktickAuth } from '../../auth';
import { tickTickApiCall } from '../../common/client';
import { ticktickCompleteTaskOutputSchema } from '../../output-schemas';

export const deleteTaskAiAction = createAction({
	auth: ticktickAuth,
	name: 'ticktick_delete_task',
	outputSchema: ticktickCompleteTaskOutputSchema,
	displayName: 'Delete Task',
	description: 'Deletes a TickTick task.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Deletes a task by projectId and taskId. Use ticktick_complete_task instead when the task is just finished. Confirm the target before calling.',
		idempotent: true,
	},
	props: {
		projectId: Property.ShortText({
			displayName: 'Project ID',
			description: 'The project the task belongs to. Use "inbox" for the Inbox.',
			required: true,
		}),
		taskId: Property.ShortText({
			displayName: 'Task ID',
			required: true,
		}),
	},
	async run(context) {
		const { projectId, taskId } = context.propsValue;
		await tickTickApiCall({
			accessToken: context.auth.access_token,
			method: HttpMethod.DELETE,
			resourceUri: `/project/${projectId}/task/${taskId}`,
		});
		return { success: true, projectId, taskId };
	},
});
