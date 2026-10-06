import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioCreateTaskOutputSchema } from '../../output-schemas';

export const attioGetTaskAction = createAction({
	auth: attioAuth,
	name: 'attio_get_task',
	outputSchema: attioCreateTaskOutputSchema,
	displayName: 'Get Task',
	description: 'Gets a task by its ID.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets one task by ID, with its content, deadline, assignees and linked records.',
		idempotent: true,
	},
	props: {
		task_id: Property.ShortText({ displayName: 'Task ID', description: 'From List Tasks or Create Task.', required: true }),
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
