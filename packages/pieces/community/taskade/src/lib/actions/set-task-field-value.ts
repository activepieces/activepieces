import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { taskadeAuth } from '../auth';
import { taskadeAiProps } from '../common/ai-props';
import { taskadeApi } from '../common/client';
import { taskadeNormalize } from '../common/normalize';
import { taskadeTasks } from '../common/tasks';
import { FieldResponse, ListAPIResponse } from '../common/types';
import { taskadeOutputSchemas } from '../output-schemas';

export const setTaskFieldValueAction = createAction({
	auth: taskadeAuth,
	name: 'set_task_field_value',
	displayName: 'Set Custom Field Value',
	description: 'Sets or clears the value of a custom field on a task.',
	classification: 'WRITE',
	audience: 'both',
	aiMetadata: {
		description:
			'Sets the value of one custom field on a Taskade task, or clears it when Clear Value is on. Get the field ID and, for Select fields, the option ID from List Custom Fields; number fields need a number. Setting the same value again changes nothing, so it is idempotent.',
		idempotent: true,
	},
	props: {
		projectId: taskadeAiProps.projectId(),
		taskId: taskadeAiProps.taskId(),
		fieldId: Property.ShortText({
			displayName: 'Field ID',
			description: 'Get it from List Custom Fields.',
			required: true,
		}),
		value: Property.ShortText({
			displayName: 'Value',
			description: 'Text, a number for number fields, or the option ID for Select fields. Required unless Clear Value is on.',
			required: false,
		}),
		clearValue: Property.Checkbox({
			displayName: 'Clear Value',
			description: 'Remove the value from the task. Value is ignored.',
			required: false,
			defaultValue: false,
		}),
	},
	outputSchema: taskadeOutputSchemas['taskFieldValue'],
	async run(context) {
		const { projectId, taskId, value, clearValue } = context.propsValue;
		const token = context.auth.secret_text;
		const parsedProjectId = taskadeApi.parseProjectId(projectId);
		const parsedTaskId = taskadeApi.requireText({ value: taskId, label: 'Task ID' });
		const fieldId = taskadeApi.requireText({ value: context.propsValue.fieldId, label: 'Field ID' });
		const path = `${taskadeApi.taskPath({ projectId: parsedProjectId, taskId: parsedTaskId })}/fields/${taskadeApi.seg({ value: fieldId, label: 'Field ID' })}`;
		const fields = await taskadeApi.request<ListAPIResponse<FieldResponse>>({
			token,
			method: HttpMethod.GET,
			path: `${taskadeApi.projectPath(parsedProjectId)}/fields`,
			operation: 'list custom fields',
		});
		const field = (fields.items ?? []).map((item) => taskadeNormalize.field(item)).find((item) => item.id === fieldId);
		if (!field) {
			const known = (fields.items ?? []).map((item) => taskadeNormalize.field(item)).map((item) => `${item.displayName ?? item.type ?? 'field'} (${item.id})`);
			throw new Error(`This project has no custom field with ID "${fieldId}". ${known.length > 0 ? `Fields: ${known.join(', ').slice(0, 500)}` : 'It has no custom fields.'}`);
		}
		if (clearValue === true) {
			await taskadeTasks.ignoreMissingSubResource({
				token,
				projectId: parsedProjectId,
				taskId: parsedTaskId,
				call: () => taskadeApi.request({ token, method: HttpMethod.DELETE, path, operation: 'clear field value' }),
				whenMissing: undefined,
			});
			return { projectId: parsedProjectId, taskId: parsedTaskId, fieldId, value: null, cleared: true };
		}
		const text = value === undefined || value === null ? '' : String(value).trim();
		if (text.length === 0) {
			throw new Error('Value is required, or turn on Clear Value to remove it.');
		}
		const sent = toFieldValue({ text, type: field.type, options: field.options });
		await taskadeApi.request({ token, method: HttpMethod.PUT, path, operation: 'set field value', body: { value: sent } });
		return { projectId: parsedProjectId, taskId: parsedTaskId, fieldId, value: sent, cleared: false };
	},
});

function toFieldValue({ text, type, options }: { text: string; type: string | null; options: Array<{ id: string; name: string }> }): string | number {
	if (type === 'number' || type === 'Rating') {
		const number = Number(text);
		if (!Number.isFinite(number)) {
			throw new Error(`This is a ${type} field, so Value must be a number; got "${text.slice(0, 100)}".`);
		}
		return number;
	}
	if (type === 'Select' && options.length > 0) {
		const byId = options.find((option) => option.id === text);
		if (byId) {
			return byId.id;
		}
		const byName = options.find((option) => option.name.toLowerCase() === text.toLowerCase());
		if (byName) {
			return byName.id;
		}
		throw new Error(`"${text.slice(0, 100)}" is not an option of this Select field. Options: ${options.map((option) => `${option.name} (${option.id})`).join(', ').slice(0, 500)}`);
	}
	return text;
}
