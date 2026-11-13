import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ticktickAuth } from '../../auth';
import { tickTickApiCall } from '../../common/client';
import { taskFields } from '../../common/task-fields';
import { ticktickCreateTaskOutputSchema } from '../../output-schemas';

export const updateTaskAiAction = createAction({
	auth: ticktickAuth,
	name: 'ticktick_update_task',
	outputSchema: ticktickCreateTaskOutputSchema,
	displayName: 'Update Task',
	description: 'Updates fields of an existing TickTick task.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Changes only the fields you supply on a task, identified by projectId and taskId (from ticktick_list_tasks or ticktick_search_tasks). Omitted fields are not sent. Empty values cannot clear a field. Use ticktick_complete_task to finish a task and ticktick_move_tasks to change its project. Sets state, so repeating it is safe.',
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
		title: Property.ShortText({
			displayName: 'Title',
			required: false,
		}),
		...taskFields.taskFieldProps(),
	},
	async run(context) {
		const { projectId, taskId, ...values } = context.propsValue;
		return await tickTickApiCall({
			accessToken: context.auth.access_token,
			method: HttpMethod.POST,
			resourceUri: `/task/${taskId}`,
			body: { id: taskId, projectId, ...taskFields.buildTaskFields({ values }) },
		});
	},
});
