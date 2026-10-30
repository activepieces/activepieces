import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ticktickAuth } from '../../auth';
import { tickTickApiCall } from '../../common/client';
import { ticktickAddTaskCommentOutputSchema } from '../../output-schemas';

export const addTaskCommentAction = createAction({
	auth: ticktickAuth,
	name: 'ticktick_add_task_comment',
	outputSchema: ticktickAddTaskCommentOutputSchema,
	displayName: 'Add Task Comment',
	description: 'Adds a comment to a task.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Adds a comment to a task by projectId and taskId and returns it with its id. Not idempotent: calling twice adds the comment twice.',
		idempotent: false,
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
		title: Property.LongText({
			displayName: 'Comment',
			description: 'The comment text.',
			required: true,
		}),
	},
	async run(context) {
		const { projectId, taskId, title } = context.propsValue;
		return await tickTickApiCall({
			accessToken: context.auth.access_token,
			method: HttpMethod.POST,
			resourceUri: `/project/${projectId}/task/${taskId}/comment`,
			body: { title },
		});
	},
});
