import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { taskadeAuth } from '../auth';
import { taskadeAiProps } from '../common/ai-props';
import { taskadeApi } from '../common/client';
import { taskadeTasks } from '../common/tasks';
import { ItemAPIResponse, ListAPIResponse, MemberResponse, TaskResponse } from '../common/types';
import { taskadeOutputSchemas } from '../output-schemas';

export const assignTaskAction = createAction({
	auth: taskadeAuth,
	name: 'assign_task',
	displayName: 'Assign Task',
	description: 'Assigns project members to a task by their handle.',
	classification: 'WRITE',
	audience: 'both',
	aiMetadata: {
		description:
			'Assigns one or more project members (by handle, from List Project Members) to a Taskade task; Taskade notifies them. Returns the task and its full assignee list. Assigning someone already assigned changes nothing, so it is idempotent.',
		idempotent: true,
	},
	props: {
		projectId: taskadeAiProps.projectId(),
		taskId: taskadeAiProps.taskId(),
		handles: Property.Array({
			displayName: 'Member Handles',
			description: 'Handles of project members, without @. Get them from List Project Members.',
			required: true,
		}),
	},
	outputSchema: taskadeOutputSchemas['assignTask'],
	async run(context) {
		const { projectId, taskId } = context.propsValue;
		const handles = toHandles(context.propsValue.handles);
		if (handles.length === 0) {
			throw new Error('Add at least one member handle.');
		}
		const token = context.auth.secret_text;
		const path = taskadeApi.taskPath({ projectId, taskId });
		const response = await taskadeApi.request<ItemAPIResponse<TaskResponse>>({
			token,
			method: HttpMethod.PUT,
			path: `${path}/assignees`,
			operation: 'assign task',
			body: { handles },
		});
		const task = await taskadeTasks.taskOrFallback({ token, projectId, taskId, item: response.item });
		const assignees = await taskadeApi.request<ListAPIResponse<MemberResponse>>({
			token,
			method: HttpMethod.GET,
			path: `${path}/assignees`,
			operation: 'get task assignees',
		});
		return {
			...task,
			assignees: (assignees.items ?? []).map((member) => ({ handle: member.handle, displayName: member.displayName ?? null })),
		};
	},
});

function toHandles(value: unknown): string[] {
	const list = Array.isArray(value) ? value : value === undefined || value === null ? [] : [value];
	const handles = list
		.map((entry: unknown) => (taskadeApi.isRecord(entry) ? Object.values(entry)[0] : entry))
		.map((entry) => (entry === undefined || entry === null ? '' : String(entry).trim().replace(/^@/, '')))
		.filter((entry) => entry.length > 0);
	return [...new Set(handles)];
}
