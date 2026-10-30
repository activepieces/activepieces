import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioDeleteTaskOutputSchema } from '../../output-schemas';

export const attioDeleteTaskAction = createAction({
	auth: attioAuth,
	name: 'attio_delete_task',
	outputSchema: attioDeleteTaskOutputSchema,
	displayName: 'Delete Task',
	description: 'Permanently deletes a task.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description: 'Permanently deletes a task by ID. Cannot be undone.',
		idempotent: false,
	},
	props: {
		task_id: Property.ShortText({ displayName: 'Task ID', description: 'From List Tasks or Create Task.', required: true }),
	},
	async run(context) {
		const { task_id } = context.propsValue;
		await attioApiCall({
			accessToken: context.auth.secret_text,
			method: HttpMethod.DELETE,
			resourceUri: `/tasks/${task_id}`,
		});
		return { success: true, task_id };
	},
});
