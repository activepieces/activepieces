import { createAction, Property } from '@activepieces/pieces-framework';
import { teamworkAuth } from '../common/auth';
import { teamworkRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createTaskComment = createAction({
	name: 'create_task_comment',
	displayName: 'Create Task Comment',
	description: 'Add a comment to a task',
	auth: teamworkAuth,
	props: {
		taskId: Property.ShortText({ displayName: 'Task ID', required: true }),
		content: Property.LongText({ displayName: 'Comment', required: true }),
	},
	async run({ auth, propsValue }) {
		const body = { comment: { body: propsValue.content } };
		return await teamworkRequest(auth, { method: HttpMethod.POST, path: `/tasks/${propsValue.taskId}/comments.json`, body });
	},
});


