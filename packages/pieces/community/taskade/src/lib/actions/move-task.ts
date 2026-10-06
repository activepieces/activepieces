import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { taskadeAuth } from '../auth';
import { taskadeAiProps } from '../common/ai-props';
import { taskadeApi } from '../common/client';
import { taskadeTasks } from '../common/tasks';
import { ItemAPIResponse, TaskResponse } from '../common/types';
import { taskadeOutputSchemas } from '../output-schemas';

export const moveTaskAction = createAction({
	auth: taskadeAuth,
	name: 'move_task',
	displayName: 'Move Task',
	description: 'Moves a task before or after another task, or inside it as a subtask.',
	classification: 'WRITE',
	audience: 'both',
	aiMetadata: {
		description:
			'Moves one Taskade task (with its subtasks) within the same project: before or after a target task, or inside it as its first or last subtask. Moving it to where it already is changes nothing, so it is idempotent.',
		idempotent: true,
	},
	props: {
		projectId: taskadeAiProps.projectId(),
		taskId: taskadeAiProps.taskId({ displayName: 'Task ID to Move' }),
		targetTaskId: taskadeAiProps.taskId({ displayName: 'Target Task ID', description: 'The task to move next to or into.' }),
		position: Property.StaticDropdown({
			displayName: 'Position',
			required: true,
			defaultValue: 'after',
			options: {
				disabled: false,
				options: [
					{ label: 'Before the target', value: 'beforebegin' },
					{ label: 'After the target', value: 'afterend' },
					{ label: 'First subtask of the target', value: 'afterbegin' },
					{ label: 'Last subtask of the target', value: 'beforeend' },
				],
			},
		}),
	},
	outputSchema: taskadeOutputSchemas['task'],
	async run(context) {
		const { projectId, taskId, targetTaskId, position } = context.propsValue;
		const movingId = taskadeApi.requireText({ value: taskId, label: 'Task ID to Move' });
		const targetId = taskadeApi.requireText({ value: targetTaskId, label: 'Target Task ID' });
		if (movingId === targetId) {
			throw new Error('A task cannot be moved relative to itself. Pick a different Target Task ID.');
		}
		const mapped = POSITIONS[String(position)] ?? (Object.values(POSITIONS).includes(String(position)) ? String(position) : undefined);
		if (!mapped) {
			throw new Error('Position must be one of: before, after, first_child, last_child.');
		}
		const token = context.auth.secret_text;
		const response = await taskadeApi.request<ItemAPIResponse<TaskResponse>>({
			token,
			method: HttpMethod.PUT,
			path: `${taskadeApi.taskPath({ projectId, taskId: movingId })}/move`,
			operation: 'move task',
			body: { target: { taskId: targetId, position: mapped } },
		});
		return taskadeTasks.taskOrFallback({ token, projectId, taskId: movingId, item: response.item });
	},
});

const POSITIONS: Record<string, string> = {
	before: 'beforebegin',
	after: 'afterend',
	first_child: 'afterbegin',
	last_child: 'beforeend',
};
