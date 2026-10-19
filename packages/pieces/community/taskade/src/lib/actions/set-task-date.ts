import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { taskadeAuth } from '../auth';
import { taskadeAiProps } from '../common/ai-props';
import { taskadeApi } from '../common/client';
import { taskadeTasks } from '../common/tasks';
import { TaskadeDate } from '../common/types';
import { taskadeOutputSchemas } from '../output-schemas';

export const setTaskDateAction = createAction({
	auth: taskadeAuth,
	name: 'set_task_date',
	displayName: 'Set Task Date',
	description: 'Sets or clears the start and end date of a task.',
	classification: 'WRITE',
	audience: 'both',
	aiMetadata: {
		description:
			'Sets a Taskade task\'s start date and optional end date (YYYY-MM-DD, optional HH:MM time, optional IANA timezone such as Europe/Berlin), or removes the date when Clear Date is on. Use for due dates and schedules. Setting the same date again changes nothing, so it is idempotent.',
		idempotent: true,
	},
	props: {
		projectId: taskadeAiProps.projectId(),
		taskId: taskadeAiProps.taskId(),
		startDate: Property.ShortText({
			displayName: 'Start Date',
			description: 'YYYY-MM-DD. Required unless Clear Date is on. For a single due date, set only this.',
			required: false,
		}),
		startTime: Property.ShortText({
			displayName: 'Start Time',
			description: 'Optional, 24-hour HH:MM or HH:MM:SS.',
			required: false,
		}),
		endDate: Property.ShortText({
			displayName: 'End Date',
			description: 'Optional, YYYY-MM-DD, for a date range.',
			required: false,
		}),
		endTime: Property.ShortText({
			displayName: 'End Time',
			description: 'Optional, 24-hour HH:MM or HH:MM:SS. Needs End Date.',
			required: false,
		}),
		timezone: Property.ShortText({
			displayName: 'Timezone',
			description: 'Optional IANA timezone for the times, for example America/New_York.',
			required: false,
		}),
		clearDate: Property.Checkbox({
			displayName: 'Clear Date',
			description: 'Remove the date from the task. The date fields above are ignored.',
			required: false,
			defaultValue: false,
		}),
	},
	outputSchema: taskadeOutputSchemas['taskDate'],
	async run(context) {
		const { projectId, taskId, startDate, startTime, endDate, endTime, timezone, clearDate } = context.propsValue;
		const token = context.auth.secret_text;
		const parsedProjectId = taskadeApi.parseProjectId(projectId);
		const parsedTaskId = taskadeApi.requireText({ value: taskId, label: 'Task ID' });
		const path = `${taskadeApi.taskPath({ projectId: parsedProjectId, taskId: parsedTaskId })}/date`;
		if (clearDate === true) {
			await taskadeTasks.ignoreMissingSubResource({
				token,
				projectId: parsedProjectId,
				taskId: parsedTaskId,
				call: () => taskadeApi.request({ token, method: HttpMethod.DELETE, path, operation: 'clear task date' }),
				whenMissing: undefined,
			});
			return { projectId: parsedProjectId, taskId: parsedTaskId, cleared: true, date: null };
		}
		const zone = optionalText(timezone);
		const start = buildDate({ date: startDate, time: startTime, timezone: zone, label: 'Start' });
		if (!start) {
			throw new Error('Start Date is required (YYYY-MM-DD), or turn on Clear Date to remove the date.');
		}
		const end = buildDate({ date: endDate, time: endTime, timezone: zone, label: 'End' });
		if (end && end.date < start.date) {
			throw new Error('End Date must be on or after Start Date.');
		}
		if (end && end.date === start.date && start.time && end.time && toSeconds(end.time) < toSeconds(start.time)) {
			throw new Error(`End Time ${end.time} is before Start Time ${start.time} on ${start.date}. Use a later End Time or a later End Date.`);
		}
		const date = end ? { start, end } : { start };
		await taskadeApi.request({ token, method: HttpMethod.PUT, path, operation: 'set task date', body: date });
		return { projectId: parsedProjectId, taskId: parsedTaskId, cleared: false, date };
	},
});

function optionalText(value: unknown): string | undefined {
	if (value === undefined || value === null) {
		return undefined;
	}
	const text = String(value).trim();
	return text.length > 0 ? text : undefined;
}

function buildDate({ date, time, timezone, label }: { date: unknown; time: unknown; timezone: string | undefined; label: string }): TaskadeDate | undefined {
	const dateText = optionalText(date);
	const timeText = optionalText(time);
	if (!dateText) {
		if (timeText) {
			throw new Error(`${label} Time needs ${label} Date.`);
		}
		return undefined;
	}
	if (!isRealDate(dateText)) {
		throw new Error(`${label} Date "${dateText}" must be a real date in YYYY-MM-DD format.`);
	}
	if (timeText && !TIME_PATTERN.test(timeText)) {
		throw new Error(`${label} Time "${timeText}" must be 24-hour HH:MM or HH:MM:SS.`);
	}
	return {
		date: dateText,
		...(timeText ? { time: timeText } : {}),
		...(timezone ? { timezone } : {}),
	};
}

function isRealDate(text: string): boolean {
	if (!DATE_PATTERN.test(text)) {
		return false;
	}
	const parsed = new Date(`${text}T00:00:00Z`);
	return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === text;
}

function toSeconds(time: string): number {
	const [hours, minutes, seconds] = time.split(':').map(Number);
	return hours * 3600 + minutes * 60 + (seconds ?? 0);
}

const DATE_PATTERN = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;
