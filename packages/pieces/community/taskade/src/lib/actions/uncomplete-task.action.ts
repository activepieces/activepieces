import { taskadeAuth } from '../auth';
import { createAction } from '@activepieces/pieces-framework';
import { taskadeProps } from '../common/props';
import { TaskadeAPIClient } from '../common/client';

export const uncompleteTaskAction = createAction({
	auth: taskadeAuth,
	name: 'taskade-uncomplete-task',
	displayName: 'Uncomplete Task',
	description: 'Marks a task as incomplete in a project.',
	props: {
		workspace_id: taskadeProps.workspace_id,
		folder_id: taskadeProps.folder_id,
		project_id: taskadeProps.project_id,
		task_id: taskadeProps.task_id,
	},
	async run(context) {
		const { project_id, task_id } = context.propsValue;

		const client = new TaskadeAPIClient(context.auth.secret_text);

		return await client.uncompleteTask(project_id, task_id);
	},
});
