import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { taskadeAuth } from '../../auth';
import { taskadeAiProps } from '../../common/ai-props';
import { taskadeApi } from '../../common/client';
import { taskadeOutputSchemas } from '../../output-schemas';

export const deleteTaskByIdAction = createAction({
	auth: taskadeAuth,
	name: 'delete_task_by_id',
	displayName: 'Delete Task (by ID)',
	description: 'Permanently deletes a task and its subtasks, given the project and task ID.',
	classification: 'DESTRUCTIVE',
	audience: 'ai',
	aiMetadata: {
		description:
			'Permanently deletes one Taskade task and all its subtasks by project ID and task ID; it cannot be undone. Use only when the user asks to remove a task. A repeat call finds it gone and reports alreadyDeleted=true, so it is idempotent.',
		idempotent: true,
	},
	props: {
		projectId: taskadeAiProps.projectId(),
		taskId: taskadeAiProps.taskId(),
	},
	outputSchema: taskadeOutputSchemas['deleteTask'],
	async run(context) {
		const { projectId, taskId } = context.propsValue;
		const token = context.auth.secret_text;
		const parsedProjectId = taskadeApi.parseProjectId(projectId);
		const parsedTaskId = taskadeApi.requireText({ value: taskId, label: 'Task ID' });
		try {
			await taskadeApi.request({
				token,
				method: HttpMethod.DELETE,
				path: taskadeApi.taskPath({ projectId: parsedProjectId, taskId: parsedTaskId }),
				operation: 'delete task',
			});
			return { projectId: parsedProjectId, taskId: parsedTaskId, deleted: true, alreadyDeleted: false };
		} catch (error) {
			if (!taskadeApi.isNotFound(error)) {
				throw error;
			}
			await taskadeApi.request({
				token,
				method: HttpMethod.GET,
				path: taskadeApi.projectPath(parsedProjectId),
				operation: 'get project',
			});
			return { projectId: parsedProjectId, taskId: parsedTaskId, deleted: true, alreadyDeleted: true };
		}
	},
});
