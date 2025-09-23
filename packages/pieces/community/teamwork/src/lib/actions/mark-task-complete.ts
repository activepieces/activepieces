import { createAction, Property } from '@activepieces/pieces-framework';
import { teamworkAuth } from '../common/auth';
import { teamworkRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const markTaskComplete = createAction({
	name: 'mark_task_complete',
	displayName: 'Mark Task Complete',
	description: 'Mark a Teamwork task as complete',
	auth: teamworkAuth,
	props: {
		taskId: Property.ShortText({ displayName: 'Task ID', required: true }),
	},
	async run({ auth, propsValue }) {
		return await teamworkRequest(auth, {
			method: HttpMethod.PUT,
			path: `/tasks/${propsValue.taskId}/complete.json`,
		});
	},
});


