import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ticktickAuth } from '../../auth';
import { tickTickApiCall } from '../../common/client';
import { ticktickCompleteTaskOutputSchema } from '../../output-schemas';

export const completeTaskAiAction = createAction({
	auth: ticktickAuth,
	name: 'ticktick_complete_task',
	outputSchema: ticktickCompleteTaskOutputSchema,
	displayName: 'Complete Task',
	description: 'Marks a TickTick task as completed.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Marks one task completed by projectId and taskId. Use ticktick_complete_tasks for several tasks in one project. Setting an already-completed task again is harmless.',
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
			method: HttpMethod.POST,
			resourceUri: `/project/${projectId}/task/${taskId}/complete`,
		});
		return { success: true, projectId, taskId };
	},
});
