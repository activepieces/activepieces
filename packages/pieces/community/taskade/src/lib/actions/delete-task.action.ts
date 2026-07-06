import { taskadeAuth } from '../auth';
import { createAction } from '@activepieces/pieces-framework';
import { taskadeProps } from '../common/props';
import { TaskadeAPIClient } from '../common/client';

export const deleteTaskAction = createAction({
	auth: taskadeAuth,
	name: 'taskade-delete-task',
	displayName: 'Delete Task',
	description: 'Delete an existing task in a project.',
	audience: 'both',
	aiMetadata: { description: 'Permanently removes a task from a Taskade project, identified by project id and task id. Use to discard a task an agent no longer needs; this is destructive and cannot be undone. Idempotent, since deleting an already-removed task leaves the project in the same state.', idempotent: true },
	props: {
		workspace_id: taskadeProps.workspace_id,
		folder_id: taskadeProps.folder_id,
		project_id: taskadeProps.project_id,
		task_id: taskadeProps.task_id,
	},
	async run(context) {
		const { project_id, task_id } = context.propsValue;

		const client = new TaskadeAPIClient(context.auth.secret_text);

		return await client.deleteTask(project_id, task_id);
	},
});
