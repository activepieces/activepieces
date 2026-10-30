import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ticktickAuth } from '../../auth';
import { tickTickApiCall } from '../../common/client';
import { taskFields } from '../../common/task-fields';
import { ticktickMoveTasksOutputSchema } from '../../output-schemas';

export const moveTasksAction = createAction({
	auth: ticktickAuth,
	name: 'ticktick_move_tasks',
	outputSchema: ticktickMoveTasksOutputSchema,
	displayName: 'Move Tasks',
	description: 'Moves tasks from one project to another.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Moves one or more tasks from a source project to a destination project (ids from ticktick_list_projects, "inbox" for the Inbox). Returns each moved task id with its new etag. Moving to the project a task is already in is harmless.',
		idempotent: true,
	},
	props: {
		fromProjectId: Property.ShortText({
			displayName: 'From Project ID',
			required: true,
		}),
		toProjectId: Property.ShortText({
			displayName: 'To Project ID',
			required: true,
		}),
		taskIds: Property.Array({
			displayName: 'Task IDs',
			description: 'The tasks to move, all currently in the source project.',
			required: true,
		}),
	},
	async run(context) {
		const { fromProjectId, toProjectId, taskIds } = context.propsValue;
		const taskIdList = taskFields.toStringArray({ value: taskIds }) ?? [];
		if (taskIdList.length === 0) {
			throw new Error('Task IDs must contain at least one id.');
		}
		const moved = await tickTickApiCall<Record<string, unknown>[]>({
			accessToken: context.auth.access_token,
			method: HttpMethod.POST,
			resourceUri: '/task/move',
			body: taskIdList.map((taskId) => ({ fromProjectId, toProjectId, taskId })),
		});
		return { moved, count: moved.length };
	},
});
