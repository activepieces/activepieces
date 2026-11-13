import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { taskadeAuth } from '../auth';
import { taskadeAiProps } from '../common/ai-props';
import { taskadeApi } from '../common/client';
import { taskadeTasks } from '../common/tasks';
import { FieldValueResponse, ItemAPIResponse, ListAPIResponse, MemberResponse, TaskDateResponse, TaskNoteResponse } from '../common/types';
import { taskadeOutputSchemas } from '../output-schemas';

export const getTaskAction = createAction({
	auth: taskadeAuth,
	name: 'get_task',
	displayName: 'Get Task',
	description: 'Gets a task with its date, note, assignees and custom field values.',
	classification: 'READ',
	audience: 'both',
	aiMetadata: {
		description:
			'Returns one Taskade task by project and task ID: text, parent, completion and, unless Include Details is off, its date, note, assignees and custom field values (empty when not set). With details it makes 5 requests, so turn details off when you only need the text. Read-only and idempotent.',
		idempotent: true,
	},
	props: {
		projectId: taskadeAiProps.projectId(),
		taskId: taskadeAiProps.taskId(),
		includeDetails: Property.Checkbox({
			displayName: 'Include Details',
			description: 'Also fetch the date, note, assignees and custom field values (4 more requests).',
			required: false,
			defaultValue: true,
		}),
	},
	outputSchema: taskadeOutputSchemas['taskDetails'],
	async run(context) {
		const { projectId, taskId, includeDetails } = context.propsValue;
		const token = context.auth.secret_text;
		const task = await taskadeTasks.getTask({ token, projectId, taskId });
		if (includeDetails === false) {
			return task;
		}
		const path = taskadeApi.taskPath({ projectId, taskId });
		const optional = <T>({ call, whenMissing }: { call: () => Promise<T>; whenMissing: T }): Promise<T> =>
			call().catch((error: unknown) => {
				if (taskadeApi.isNotFound(error)) {
					return whenMissing;
				}
				throw error;
			});
		const date = await optional({
			call: async () =>
				(await taskadeApi.request<ItemAPIResponse<TaskDateResponse>>({ token, method: HttpMethod.GET, path: `${path}/date`, operation: 'get task date' })).item ?? null,
			whenMissing: null,
		});
		const note = await optional({
			call: async () =>
				(await taskadeApi.request<ItemAPIResponse<TaskNoteResponse>>({ token, method: HttpMethod.GET, path: `${path}/note`, operation: 'get task note' })).item ?? null,
			whenMissing: null,
		});
		const assignees = await optional({
			call: async () =>
				(await taskadeApi.request<ListAPIResponse<MemberResponse>>({ token, method: HttpMethod.GET, path: `${path}/assignees`, operation: 'get task assignees' })).items ?? [],
			whenMissing: [],
		});
		const fields = await optional({
			call: async () =>
				(await taskadeApi.request<ListAPIResponse<FieldValueResponse>>({ token, method: HttpMethod.GET, path: `${path}/fields`, operation: 'get task field values' })).items ?? [],
			whenMissing: [],
		});
		return {
			...task,
			date,
			note,
			assignees: assignees.map((member) => ({ handle: member.handle, displayName: member.displayName ?? null })),
			fields: fields.map((field) => ({ fieldId: field.fieldId, value: field.value ?? null })),
		};
	},
});
