import { assertNotNullOrUndefined } from '@activepieces/shared';
import { todoistAuth } from '../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { todoistRestClient } from '../common/client/rest-client';

export const todoistMarkTaskCompletedAction = createAction({
	auth: todoistAuth,
	name: 'mark_task_completed',
	displayName: 'Mark Task as Completed',
	description: 'Marks a task as being completed.',
	audience: 'both',
	aiMetadata: { description: 'Closes (completes) an active Todoist task by its task_id; recurring tasks advance to their next occurrence. Use once you have the task ID (e.g. from Find Task) and want to mark it done. Idempotent: completing an already-completed task leaves it completed with no additional effect.', idempotent: true },
	props: {
		task_id: Property.ShortText({
			displayName: 'Task ID',
			required: true,
		}),
	},
	async run(context) {
		const token = context.auth.access_token;
		const { task_id } = context.propsValue;

		assertNotNullOrUndefined(token, 'token');

		return await todoistRestClient.tasks.close({ token, task_id });
	},
});
