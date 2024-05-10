import { taskadeAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { taskadeProps } from '../common/props';
import { TaskadeAPIClient } from '../common/client';

export const createTaskAction = createAction({
	auth: taskadeAuth,
	name: 'taskade-create-task',
	displayName: 'Create Task',
	description: 'Creates a new task.',
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
		content: Property.LongText({
			displayName: 'Task Content',
			required: true,
		}),
		placement: Property.StaticDropdown({
			displayName: 'Placement',
			description: 'Placement of task in block',
			required: true,
			defaultValue: 'afterbegin',
			options: {
				disabled: false,
				options: [
					{
						label: 'afterbegin',
						value: 'afterbegin',
					},
					{
						label: 'beforeend',
						value: 'beforeend',
					},
				],
			},
		}),
	},
	async run(context) {
		const { project_id, content_type, content, placement } = context.propsValue;

		const client = new TaskadeAPIClient(context.auth);

		return await client.createTask(project_id, {
			content,
			contentType: content_type,
			placement,
		});
	},
});
