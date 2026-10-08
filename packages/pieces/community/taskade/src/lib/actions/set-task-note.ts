import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { taskadeAuth } from '../auth';
import { taskadeAiProps } from '../common/ai-props';
import { taskadeApi } from '../common/client';
import { taskadeTasks } from '../common/tasks';
import { taskadeOutputSchemas } from '../output-schemas';

export const setTaskNoteAction = createAction({
	auth: taskadeAuth,
	name: 'set_task_note',
	displayName: 'Set Task Note',
	description: 'Sets or clears the note attached to a task.',
	classification: 'WRITE',
	audience: 'both',
	aiMetadata: {
		description:
			'Replaces the note attached to a Taskade task (single line, Markdown or plain text), or removes it when Clear Note is on. Use for details that do not fit in the task text. Setting the same note again changes nothing, so it is idempotent.',
		idempotent: true,
	},
	props: {
		projectId: taskadeAiProps.projectId(),
		taskId: taskadeAiProps.taskId(),
		note: Property.LongText({
			displayName: 'Note',
			description: 'Required unless Clear Note is on. Taskade accepts a single line.',
			required: false,
		}),
		format: taskadeAiProps.format(),
		clearNote: Property.Checkbox({
			displayName: 'Clear Note',
			description: 'Remove the note from the task. Note is ignored.',
			required: false,
			defaultValue: false,
		}),
	},
	outputSchema: taskadeOutputSchemas['taskNote'],
	async run(context) {
		const { projectId, taskId, note, format, clearNote } = context.propsValue;
		const token = context.auth.secret_text;
		const parsedProjectId = taskadeApi.parseProjectId(projectId);
		const parsedTaskId = taskadeApi.requireText({ value: taskId, label: 'Task ID' });
		const path = `${taskadeApi.taskPath({ projectId: parsedProjectId, taskId: parsedTaskId })}/note`;
		if (clearNote === true) {
			await taskadeTasks.ignoreMissingSubResource({
				token,
				projectId: parsedProjectId,
				taskId: parsedTaskId,
				call: () => taskadeApi.request({ token, method: HttpMethod.DELETE, path, operation: 'clear task note' }),
				whenMissing: undefined,
			});
			return { projectId: parsedProjectId, taskId: parsedTaskId, cleared: true, note: null };
		}
		const value = taskadeApi.requireText({ value: note, label: 'Note' });
		if (/[\r\n]/.test(value)) {
			throw new Error('Taskade task notes must be a single line. Remove the line breaks (for example join lines with " / ").');
		}
		const body = { type: taskadeTasks.contentType(format), value };
		await taskadeApi.request({ token, method: HttpMethod.PUT, path, operation: 'set task note', body });
		return { projectId: parsedProjectId, taskId: parsedTaskId, cleared: false, note: body };
	},
});
