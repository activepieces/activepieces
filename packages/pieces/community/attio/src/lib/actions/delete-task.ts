import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../auth';
import { attioApiCall } from '../common/client';
import { taskIdDropdown } from '../common/props';

export const deleteTaskAction = createAction({
	auth: attioAuth,
	name: 'delete_task',
	displayName: 'Delete Task',
	description: 'Permanently delete a task by its ID.',
	props: {
		task_id: taskIdDropdown({
			displayName: 'Task',
			description: 'The task to delete.',
			required: true,
		}),
	},
	async run(context) {
		const { task_id } = context.propsValue;

		await attioApiCall({
			accessToken: context.auth.secret_text,
			method: HttpMethod.DELETE,
			resourceUri: `/tasks/${task_id}`,
		});

		return { success: true };
	},
});
