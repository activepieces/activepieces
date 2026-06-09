import { taskadeAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { taskadeProps } from '../common/props';
import { TaskadeAPIClient } from '../common/client';

export const updateTaskAction = createAction({
	auth: taskadeAuth,
	name: 'taskade-update-task',
	displayName: 'Update Task',
	description: 'Updates the content of an existing task.',
	props: {
		workspace_id: taskadeProps.workspace_id,
		folder_id: taskadeProps.folder_id,
		project_id: taskadeProps.project_id,
		task_id: taskadeProps.task_id,
		content_type: Property.StaticDropdown({
			displayName: 'Content Type',
			required: true,
			defaultValue: 'text/markdown',
			options: {
				disabled: false,
				options: [
					{
						label: 'text/markdown',
						value: 'text/markdown',
					},
					{
						label: 'text/plain',
						value: 'text/plain',
					},
				],
			},
		}),
		content: Property.ShortText({
			displayName: 'Task Content',
			description: 'New task content. Must be a single line with a maximum of 2000 characters.',
			required: true,
		}),
	},
	async run(context) {
		const { project_id, task_id, content_type, content } = context.propsValue;

		const client = new TaskadeAPIClient(context.auth.secret_text);

		return await client.updateTask(project_id, task_id, {
			contentType: content_type,
			content,
		});
	},
});
