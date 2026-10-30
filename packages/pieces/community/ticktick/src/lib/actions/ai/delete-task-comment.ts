import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ticktickAuth } from '../../auth';
import { tickTickApiCall } from '../../common/client';
import { ticktickDeleteTaskCommentOutputSchema } from '../../output-schemas';

export const deleteTaskCommentAction = createAction({
	auth: ticktickAuth,
	name: 'ticktick_delete_task_comment',
	outputSchema: ticktickDeleteTaskCommentOutputSchema,
	displayName: 'Delete Task Comment',
	description: 'Deletes a comment from a task.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes a comment by its id (from ticktick_list_task_comments or ticktick_add_task_comment). Confirm the target before calling.',
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
		commentId: Property.ShortText({
			displayName: 'Comment ID',
			description: 'The comment ID, from the List Task Comments action.',
			required: true,
		}),
	},
	async run(context) {
		const { projectId, taskId, commentId } = context.propsValue;
		await tickTickApiCall({
			accessToken: context.auth.access_token,
			method: HttpMethod.DELETE,
			resourceUri: `/project/${projectId}/task/${taskId}/comment/${commentId}`,
		});
		return { success: true, projectId, taskId, commentId };
	},
});
