import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ticktickAuth } from '../../auth';
import { tickTickApiCall } from '../../common/client';
import { taskFields } from '../../common/task-fields';
import { ticktickCreateTaskOutputSchema } from '../../output-schemas';

export const createTaskAiAction = createAction({
	auth: ticktickAuth,
	name: 'ticktick_create_task',
	outputSchema: ticktickCreateTaskOutputSchema,
	displayName: 'Create Task',
	description: 'Creates a new task in a TickTick project.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a task in a project (projectId from ticktick_list_projects, or "inbox") and returns it with its id. Supports dates, time zone, reminders, tags, repeat rule, priority and subtasks. Not idempotent: each call creates a new task, so search first when unsure. Use ticktick_batch_save_tasks for many tasks.',
		idempotent: false,
	},
	props: {
		projectId: Property.ShortText({
			displayName: 'Project ID',
			description: 'The project to create the task in. Use "inbox" for the Inbox.',
			required: true,
		}),
		title: Property.ShortText({
			displayName: 'Title',
			required: true,
		}),
		...taskFields.taskFieldProps(),
	},
	async run(context) {
		const { projectId, ...values } = context.propsValue;
		return await tickTickApiCall({
			accessToken: context.auth.access_token,
			method: HttpMethod.POST,
			resourceUri: '/task',
			body: { projectId, ...taskFields.buildTaskFields({ values }) },
		});
	},
});
