import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { taskadeAuth } from '../auth';
import { taskadeAiProps } from '../common/ai-props';
import { taskadeApi } from '../common/client';
import { taskadeTasks } from '../common/tasks';
import { CreateTaskResponse } from '../common/types';
import { taskadeOutputSchemas } from '../output-schemas';

export const createTasksAction = createAction({
	auth: taskadeAuth,
	name: 'create_tasks',
	displayName: 'Create Tasks',
	description: 'Adds 1-20 tasks to a project, at the top or bottom, or next to or inside another task.',
	classification: 'WRITE',
	audience: 'both',
	aiMetadata: {
		description:
			'Adds 1-20 tasks to a Taskade project in one request, at the top or bottom of the project, or before, after or inside (as first or last subtask of) an existing task given by Relative To Task ID. Each task text is one line of up to 2,000 characters of Markdown or plain text. Returns the created task IDs. Not idempotent: each call adds new tasks.',
		idempotent: false,
	},
	props: {
		projectId: taskadeAiProps.projectId(),
		tasks: Property.Array({
			displayName: 'Tasks',
			description: 'One entry per task (1-20). Each entry is a single line of up to 2,000 characters.',
			required: true,
		}),
		format: taskadeAiProps.format(),
		position: Property.StaticDropdown({
			displayName: 'Position',
			required: false,
			defaultValue: 'bottom',
			options: {
				disabled: false,
				options: [
					{ label: 'Bottom of project', value: 'bottom' },
					{ label: 'Top of project', value: 'top' },
					{ label: 'Before a task', value: 'before' },
					{ label: 'After a task', value: 'after' },
					{ label: 'First subtask of a task', value: 'first_child' },
					{ label: 'Last subtask of a task', value: 'last_child' },
				],
			},
		}),
		relativeToTaskId: taskadeAiProps.taskId({
			displayName: 'Relative To Task ID',
			description: 'Required for Before, After, First subtask and Last subtask positions.',
			required: false,
		}),
	},
	outputSchema: taskadeOutputSchemas['createTasks'],
	async run(context) {
		const { projectId, tasks, format, position, relativeToTaskId } = context.propsValue;
		const texts = toTexts(tasks);
		if (texts.length === 0) {
			throw new Error('Add at least one task.');
		}
		if (texts.length > MAX_TASKS) {
			throw new Error(`Taskade accepts at most ${MAX_TASKS} tasks per call; you passed ${texts.length}. Split them into several calls.`);
		}
		const contents = texts.map((text, index) => taskadeTasks.validateTaskText({ value: text, label: `Task ${index + 1}`, singleLine: true }));
		const placement = toPlacement({ position, relativeToTaskId });
		const contentType = taskadeTasks.contentType(format);
		const ordered = placement.reverseOrder ? [...contents].reverse() : contents;
		const response = await taskadeApi.request<CreateTaskResponse>({
			token: context.auth.secret_text,
			method: HttpMethod.POST,
			path: `${taskadeApi.projectPath(projectId)}/tasks/`,
			operation: 'create tasks',
			body: {
				tasks: ordered.map((content) => ({
					contentType,
					content,
					placement: placement.placement,
					...(placement.taskId ? { taskId: placement.taskId } : {}),
				})),
			},
		});
		const created = (response.item ?? []).map((item, index) => ({
			id: item.id,
			text: item.text ?? ordered[index] ?? '',
			completed: item.completed === true,
		}));
		const items = placement.reverseOrder ? [...created].reverse() : created;
		return { items, count: items.length };
	},
});

function toTexts(tasks: unknown): string[] {
	if (tasks === undefined || tasks === null) {
		return [];
	}
	const list = Array.isArray(tasks) ? tasks : [tasks];
	return list
		.map((entry: unknown) => {
			if (taskadeApi.isRecord(entry)) {
				const value = entry['content'] ?? entry['text'] ?? Object.values(entry)[0];
				return value === undefined || value === null ? '' : String(value);
			}
			return entry === undefined || entry === null ? '' : String(entry);
		})
		.map((text) => text.trim())
		.filter((text) => text.length > 0);
}

function toPlacement({ position, relativeToTaskId }: { position: unknown; relativeToTaskId: unknown }): Placement {
	const value = typeof position === 'string' && position.length > 0 ? position : 'bottom';
	if (value === 'top') {
		return { placement: 'afterbegin', reverseOrder: true };
	}
	if (value === 'bottom') {
		return { placement: 'beforeend', reverseOrder: false };
	}
	const anchor = POSITION_TO_PLACEMENT[value];
	if (!anchor) {
		throw new Error(`Unknown position "${value}". Use top, bottom, before, after, first_child or last_child.`);
	}
	const taskId = taskadeApi.requireText({ value: relativeToTaskId, label: 'Relative To Task ID' });
	return { placement: anchor.placement, taskId, reverseOrder: anchor.reverseOrder };
}

const MAX_TASKS = 20;

const POSITION_TO_PLACEMENT: Record<string, { placement: string; reverseOrder: boolean }> = {
	before: { placement: 'beforebegin', reverseOrder: false },
	after: { placement: 'afterend', reverseOrder: true },
	first_child: { placement: 'afterbegin', reverseOrder: true },
	last_child: { placement: 'beforeend', reverseOrder: false },
};

type Placement = { placement: string; taskId?: string; reverseOrder: boolean };
