import { taskadeAuth } from '../auth';
import { createAction } from '@activepieces/pieces-framework';
import { taskadeProps } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';
import { taskadeApi } from '../common/client';
import { taskadeOutputSchemas } from '../output-schemas';

export const deleteTaskAction = createAction({
	auth: taskadeAuth,
	name: 'taskade-delete-task',
	classification: 'DESTRUCTIVE',
	displayName: 'Delete Task',
	description: 'Delete an existing task in a project.',
	audience: 'human',
	aiMetadata: { description: 'Permanently removes a task from a Taskade project, identified by project id and task id. Use to discard a task an agent no longer needs; this is destructive and cannot be undone. A repeat call finds the task gone and returns ok with alreadyDeleted=true, so it is idempotent.', idempotent: true },
	props: {
		workspace_id: taskadeProps.workspace_id,
		folder_id: taskadeProps.folder_id,
		project_id: taskadeProps.project_id,
		task_id: taskadeProps.task_id,
	},
	outputSchema: taskadeOutputSchemas['legacyDelete'],
	async run(context) {
		const { project_id, task_id } = context.propsValue;
		const token = context.auth.secret_text;
		const projectPath = `/projects/${taskadeApi.seg({ value: project_id, label: 'Project' })}`;
		try {
			await taskadeApi.request({
				token,
				method: HttpMethod.DELETE,
				path: `${projectPath}/tasks/${taskadeApi.seg({ value: task_id, label: 'Task' })}`,
				operation: 'delete task',
			});
			return { ok: true, alreadyDeleted: false };
		} catch (error) {
			if (!taskadeApi.isNotFound(error)) {
				throw error;
			}
			await taskadeApi.request({ token, method: HttpMethod.GET, path: projectPath, operation: 'get project' });
			return { ok: true, alreadyDeleted: true };
		}
	},
});
