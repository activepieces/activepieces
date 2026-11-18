import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { taskadeAuth } from '../auth';
import { taskadeAiProps } from '../common/ai-props';
import { taskadeApi } from '../common/client';
import { taskadeTasks } from '../common/tasks';
import { ItemAPIResponse, ListAPIResponse, MemberResponse, TaskResponse } from '../common/types';
import { taskadeOutputSchemas } from '../output-schemas';

export const unassignTaskAction = createAction({
	auth: taskadeAuth,
	name: 'unassign_task',
	displayName: 'Unassign Task',
	description: 'Removes one member from a task\'s assignees.',
	classification: 'WRITE',
	audience: 'both',
	aiMetadata: {
		description:
			'Removes one member (by handle) from the assignees of a Taskade task. If that person was not assigned, nothing changes and wasAssigned is false, so it is idempotent.',
		idempotent: true,
	},
	props: {
		projectId: taskadeAiProps.projectId(),
		taskId: taskadeAiProps.taskId(),
		handle: Property.ShortText({
			displayName: 'Member Handle',
			description: 'Handle without @, from List Project Members or Get Task.',
			required: true,
		}),
	},
	outputSchema: taskadeOutputSchemas['unassignTask'],
	async run(context) {
		const { projectId, taskId } = context.propsValue;
		const handle = taskadeApi.requireText({ value: context.propsValue.handle, label: 'Member Handle' }).replace(/^@/, '');
		const token = context.auth.secret_text;
		try {
			const response = await taskadeApi.request<ItemAPIResponse<TaskResponse>>({
				token,
				method: HttpMethod.DELETE,
				path: `${taskadeApi.taskPath({ projectId, taskId })}/assignees/${taskadeApi.seg({ value: handle, label: 'Member Handle' })}`,
				operation: 'unassign task',
			});
			const task = await taskadeTasks.taskOrFallback({ token, projectId, taskId, item: response.item });
			return { ...task, removedHandle: handle, wasAssigned: true };
		} catch (error) {
			const status = taskadeApi.statusOf(error);
			if (status !== 400 && status !== 404) {
				throw error;
			}
			const task = await taskadeTasks.getTask({ token, projectId, taskId });
			const assignees = await taskadeApi.request<ListAPIResponse<MemberResponse>>({
				token,
				method: HttpMethod.GET,
				path: `${taskadeApi.taskPath({ projectId, taskId })}/assignees`,
				operation: 'get task assignees',
			});
			if ((assignees.items ?? []).some((member) => member.handle.toLowerCase() === handle.toLowerCase())) {
				throw error;
			}
			return { ...task, removedHandle: handle, wasAssigned: false };
		}
	},
});
