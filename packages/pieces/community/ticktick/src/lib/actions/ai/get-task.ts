import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ticktickAuth } from '../../auth';
import { tickTickApiCall } from '../../common/client';
import { ticktickCreateTaskOutputSchema } from '../../output-schemas';

export const getTaskAiAction = createAction({
	auth: ticktickAuth,
	name: 'ticktick_get_task',
	outputSchema: ticktickCreateTaskOutputSchema,
	displayName: 'Get Task',
	description: 'Retrieves a TickTick task by its project and task IDs.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Fetches one task in full (dates, tags, reminders, subtasks, assignee) by projectId and taskId. Get the ids from ticktick_list_tasks, ticktick_search_tasks or ticktick_get_project_data. Read-only.',
		idempotent: true,
	},
	props: {
		projectId: Property.ShortText({
			displayName: 'Project ID',
			description: 'The project the task belongs to. Use "inbox" for the Inbox.',
			required: true,
		}),
		taskId: Property.ShortText({
			displayName: 'Task ID',
			required: true,
		}),
	},
	async run(context) {
		const { projectId, taskId } = context.propsValue;
		return await tickTickApiCall({
			accessToken: context.auth.access_token,
			method: HttpMethod.GET,
			resourceUri: `/project/${projectId}/task/${taskId}`,
		});
	},
});
