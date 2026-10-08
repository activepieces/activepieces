import { createAction } from '@activepieces/pieces-framework';
import { taskadeAuth } from '../../auth';
import { taskadeAiProps } from '../../common/ai-props';
import { taskadeTasks } from '../../common/tasks';
import { taskadeOutputSchemas } from '../../output-schemas';

export const completeTaskByIdAction = createAction({
	auth: taskadeAuth,
	name: 'complete_task_by_id',
	displayName: 'Complete Task (by ID)',
	description: 'Marks a task as completed, given the project and task ID.',
	classification: 'WRITE',
	audience: 'ai',
	aiMetadata: {
		description:
			'Marks one Taskade task as completed, given its project ID (or link) and task ID (from List Tasks or Find Tasks). Use to check off work; Reopen Task undoes it. Completing an already completed task changes nothing, so it is idempotent.',
		idempotent: true,
	},
	props: {
		projectId: taskadeAiProps.projectId(),
		taskId: taskadeAiProps.taskId(),
	},
	outputSchema: taskadeOutputSchemas['task'],
	async run(context) {
		const { projectId, taskId } = context.propsValue;
		const token = context.auth.secret_text;
		const { task } = await taskadeTasks.setCompletion({ token, projectId, taskId, completed: true });
		return task;
	},
});
