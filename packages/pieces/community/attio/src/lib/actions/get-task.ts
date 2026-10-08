import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../auth';
import { attioApiCall } from '../common/client';
import { taskIdDropdown } from '../common/props';
import { createTaskOutputSchema } from '../output-schemas';

export const getTaskAction = createAction({
	auth: attioAuth,
	name: 'get_task',
	outputSchema: createTaskOutputSchema,
	classification: 'READ',
	displayName: 'Get Task',
	description: 'Fetch a single task by its ID.',
	audience: 'human',
	aiMetadata: { description: 'Fetches a single task by its ID and returns its details. Choose this when you already have the task ID; use List Tasks to find a task by its attributes. Read-only and idempotent.', idempotent: true },
	props: {
		task_id: taskIdDropdown({
			displayName: 'Task',
			description: 'The task to retrieve.',
			required: true,
		}),
	},
	async run(context) {
		const { task_id } = context.propsValue;

		const response = await attioApiCall<{ data: Record<string, unknown> }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: `/tasks/${task_id}`,
		});

		return response.data;
	},
});
