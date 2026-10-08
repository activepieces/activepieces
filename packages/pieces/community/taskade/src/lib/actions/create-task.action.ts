import { taskadeAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { taskadeProps } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';
import { taskadeApi } from '../common/client';
import { taskadeTasks } from '../common/tasks';
import { CreateTaskResponse } from '../common/types';
import { taskadeOutputSchemas } from '../output-schemas';

export const createTaskAction = createAction({
	auth: taskadeAuth,
	name: 'taskade-create-task',
	classification: 'WRITE',
	displayName: 'Create Task',
	description: 'Creates a new task.',
	audience: 'human',
	aiMetadata: { description: 'Adds a new task to a Taskade project, with the task body supplied as markdown or plain text and positioned at the start or end of the project. Use to append work items to an existing project; requires the target project id. Creates a new task on every call, so it is not idempotent.', idempotent: false },
	props: {
		workspace_id: taskadeProps.workspace_id,
		folder_id: taskadeProps.folder_id,
		project_id: taskadeProps.project_id,
		content_type: Property.StaticDropdown({
			displayName: 'Content Type',
			required: true,
			defaultValue: 'text/markdown',
			options: {
				disabled: false,
				options: [
					{
						label: 'Markdown',
						value: 'text/markdown',
					},
					{
						label: 'Plain text',
						value: 'text/plain',
					},
				],
			},
		}),
		content: Property.LongText({
			displayName: 'Task Content',
			description: 'Up to 2,000 characters.',
			required: true,
		}),
		placement: Property.StaticDropdown({
			displayName: 'Placement',
			description: 'Where to add the task in the project.',
			required: true,
			defaultValue: 'afterbegin',
			options: {
				disabled: false,
				options: [
					{
						label: 'Top of project',
						value: 'afterbegin',
					},
					{
						label: 'Bottom of project',
						value: 'beforeend',
					},
				],
			},
		}),
	},
	outputSchema: taskadeOutputSchemas['legacyCreateTask'],
	async run(context) {
		const { project_id, content_type, content, placement } = context.propsValue;
		const text = taskadeTasks.validateTaskText({ value: content, label: 'Task Content', singleLine: false });
		return taskadeApi.request<CreateTaskResponse>({
			token: context.auth.secret_text,
			method: HttpMethod.POST,
			path: `/projects/${taskadeApi.seg({ value: project_id, label: 'Project' })}/tasks`,
			operation: 'create task',
			body: { tasks: [{ content: text, contentType: content_type, placement }] },
		});
	},
});
