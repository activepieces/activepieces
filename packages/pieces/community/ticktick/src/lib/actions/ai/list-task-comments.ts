import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ticktickAuth } from '../../auth';
import { tickTickApiCall } from '../../common/client';
import { ticktickListTaskCommentsOutputSchema } from '../../output-schemas';

export const listTaskCommentsAction = createAction({
	auth: ticktickAuth,
	name: 'ticktick_list_task_comments',
	outputSchema: ticktickListTaskCommentsOutputSchema,
	displayName: 'List Task Comments',
	description: 'Lists the comments on a task.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists a task\'s comments with their ids and text. Use to get the comment id for ticktick_delete_task_comment. Read-only.',
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
		const comments = await tickTickApiCall<Record<string, unknown>[]>({
			accessToken: context.auth.access_token,
			method: HttpMethod.GET,
			resourceUri: `/project/${projectId}/task/${taskId}/comments`,
		});
		return { comments, count: comments.length };
	},
});
