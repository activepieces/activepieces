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
	audience: 'both',
	aiMetadata: { description: 'Permanently deletes a task identified by its ID. Use this to remove a task you no longer need; the deletion cannot be undone. Effectively idempotent on end-state — once the task is gone, repeating the call has no further effect (though the second call may error on the missing task).', idempotent: true },
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
