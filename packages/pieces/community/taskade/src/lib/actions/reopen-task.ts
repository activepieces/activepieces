import { createAction } from '@activepieces/pieces-framework';
import { taskadeAuth } from '../auth';
import { taskadeAiProps } from '../common/ai-props';
import { taskadeTasks } from '../common/tasks';
import { taskadeOutputSchemas } from '../output-schemas';

export const reopenTaskAction = createAction({
	auth: taskadeAuth,
	name: 'reopen_task',
	displayName: 'Reopen Task',
	description: 'Marks a completed task as not completed.',
	classification: 'WRITE',
	audience: 'both',
	aiMetadata: {
		description:
			'Marks a completed Taskade task as open again, by project and task ID. Use to undo Complete Task. Reopening an open task changes nothing, so it is idempotent.',
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
		const { task } = await taskadeTasks.setCompletion({ token, projectId, taskId, completed: false });
		return task;
	},
});
