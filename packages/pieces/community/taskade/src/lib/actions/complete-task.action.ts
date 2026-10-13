import { taskadeAuth } from '../auth';
import { createAction } from '@activepieces/pieces-framework';
import { taskadeProps } from '../common/props';
import { taskadeTasks } from '../common/tasks';
import { taskadeOutputSchemas } from '../output-schemas';

export const completeTaskAction = createAction({
	auth: taskadeAuth,
	name: 'taskade-complete-task',
	classification: 'WRITE',
	displayName: 'Complete Task',
	description: 'Complete a task in a project.',
	audience: 'human',
	aiMetadata: { description: 'Marks an existing Taskade task as completed within a given project. Use when an agent needs to check off or close out a task; requires the project id and task id. Idempotent, since re-running leaves the task in the same completed state.', idempotent: true },
	props: {
		workspace_id: taskadeProps.workspace_id,
		folder_id: taskadeProps.folder_id,
		project_id: taskadeProps.project_id,
		task_id: taskadeProps.task_id,
	},
	outputSchema: taskadeOutputSchemas['legacyTaskItem'],
	async run(context) {
		const { project_id, task_id } = context.propsValue;
		const { task } = await taskadeTasks.setCompletion({ token: context.auth.secret_text, projectId: project_id, taskId: task_id, completed: true });
		return { ok: true, item: { id: task.id, text: task.text, parentId: task.parentId, completed: task.completed } };
	},
});
