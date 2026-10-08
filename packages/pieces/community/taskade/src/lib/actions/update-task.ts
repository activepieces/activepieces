import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { taskadeAuth } from '../auth';
import { taskadeAiProps } from '../common/ai-props';
import { taskadeApi } from '../common/client';
import { taskadeTasks } from '../common/tasks';
import { ItemAPIResponse, TaskResponse } from '../common/types';
import { taskadeOutputSchemas } from '../output-schemas';

export const updateTaskAction = createAction({
	auth: taskadeAuth,
	name: 'update_task',
	displayName: 'Update Task Text',
	description: 'Replaces the text of a task.',
	classification: 'WRITE',
	audience: 'both',
	aiMetadata: {
		description:
			'Replaces the text of one Taskade task (a single line, up to 2,000 characters, Markdown or plain text). Use to rename or rewrite a task; use Set Task Note for longer details. Setting the same text again changes nothing, so it is idempotent.',
		idempotent: true,
	},
	props: {
		projectId: taskadeAiProps.projectId(),
		taskId: taskadeAiProps.taskId(),
		text: Property.ShortText({
			displayName: 'New Text',
			description: 'Single line, up to 2,000 characters.',
			required: true,
		}),
		format: taskadeAiProps.format(),
	},
	outputSchema: taskadeOutputSchemas['task'],
	async run(context) {
		const { projectId, taskId, text, format } = context.propsValue;
		const content = taskadeTasks.validateTaskText({ value: text, label: 'New Text', singleLine: true });
		const token = context.auth.secret_text;
		const response = await taskadeApi.request<ItemAPIResponse<TaskResponse>>({
			token,
			method: HttpMethod.PUT,
			path: taskadeApi.taskPath({ projectId, taskId }),
			operation: 'update task',
			body: { contentType: taskadeTasks.contentType(format), content },
		});
		return taskadeTasks.taskOrFallback({ token, projectId, taskId, item: response.item });
	},
});
