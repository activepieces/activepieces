import { taskadeAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { taskadeProps } from '../common/props';
import { TaskadeAPIClient } from '../common/client';

export const moveTaskAction = createAction({
	auth: taskadeAuth,
	name: 'taskade-move-task',
	displayName: 'Move Task',
	description: 'Moves a task relative to another task in a project.',
	props: {
		workspace_id: taskadeProps.workspace_id,
		folder_id: taskadeProps.folder_id,
		project_id: taskadeProps.project_id,
		task_id: taskadeProps.task_id,
		target_task_id: taskadeProps.target_task_id,
		position: Property.StaticDropdown({
			displayName: 'Position',
			description: 'Position of the task relative to the target task',
			required: true,
			defaultValue: 'afterend',
			options: {
				disabled: false,
				options: [
					{
						label: 'beforebegin',
						value: 'beforebegin',
					},
					{
						label: 'afterbegin',
						value: 'afterbegin',
					},
					{
						label: 'beforeend',
						value: 'beforeend',
					},
					{
						label: 'afterend',
						value: 'afterend',
					},
				],
			},
		}),
	},
	async run(context) {
		const { project_id, task_id, target_task_id, position } = context.propsValue;

		const client = new TaskadeAPIClient(context.auth.secret_text);

		return await client.moveTask(project_id, task_id, {
			target: {
				taskId: target_task_id,
				position,
			},
		});
	},
});
