import { Property } from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import {
	TICKTICK_PRIORITY_HIGH,
	TICKTICK_PRIORITY_LOW,
	TICKTICK_PRIORITY_MEDIUM,
	TICKTICK_PRIORITY_NONE,
} from './constants';

function taskFieldProps() {
	return {
		content: Property.LongText({
			displayName: 'Content',
			description: 'The task content (notes).',
			required: false,
		}),
		desc: Property.LongText({
			displayName: 'Checklist Description',
			description: 'Description of the checklist, used together with subtasks.',
			required: false,
		}),
		isAllDay: Property.StaticDropdown({
			displayName: 'All Day',
			required: false,
			options: {
				options: [
					{ label: 'Yes', value: true },
					{ label: 'No', value: false },
				],
			},
		}),
		startDate: Property.DateTime({
			displayName: 'Start Date',
			required: false,
		}),
		dueDate: Property.DateTime({
			displayName: 'Due Date',
			required: false,
		}),
		timeZone: Property.ShortText({
			displayName: 'Time Zone',
			description: 'IANA time zone the dates are specified in, for example "America/Los_Angeles".',
			required: false,
		}),
		reminders: Property.Array({
			displayName: 'Reminders',
			description: 'Reminder triggers, for example "TRIGGER:P0DT9H0M0S" or "TRIGGER:PT0S".',
			required: false,
		}),
		tags: Property.Array({
			displayName: 'Tags',
			description: 'Tag names to put on the task.',
			required: false,
		}),
		repeatFlag: Property.ShortText({
			displayName: 'Repeat Rule',
			description: 'Recurrence rule, for example "RRULE:FREQ=DAILY;INTERVAL=1".',
			required: false,
		}),
		priority: Property.StaticDropdown({
			displayName: 'Priority',
			required: false,
			options: {
				options: [
					{ label: 'None', value: TICKTICK_PRIORITY_NONE },
					{ label: 'Low', value: TICKTICK_PRIORITY_LOW },
					{ label: 'Medium', value: TICKTICK_PRIORITY_MEDIUM },
					{ label: 'High', value: TICKTICK_PRIORITY_HIGH },
				],
			},
		}),
		sortOrder: Property.Number({
			displayName: 'Sort Order',
			required: false,
		}),
		items: Property.Json({
			displayName: 'Subtasks',
			description:
				'Array of subtasks, each like {"title": "Step", "status": 0}. Status 0 is open, 1 is completed.',
			required: false,
		}),
	};
}

function formatDate({ value }: { value: string }): string {
	return dayjs(value).format('YYYY-MM-DDTHH:mm:ssZZ');
}

function toStringArray({ value }: { value: unknown }): string[] | undefined {
	if (!Array.isArray(value)) {
		return undefined;
	}
	return value.filter((item): item is string => typeof item === 'string' && item.length > 0);
}

function buildTaskFields({
	values,
}: {
	values: {
		title?: string;
		content?: string;
		desc?: string;
		isAllDay?: boolean;
		startDate?: string;
		dueDate?: string;
		timeZone?: string;
		reminders?: unknown;
		tags?: unknown;
		repeatFlag?: string;
		priority?: number;
		sortOrder?: number;
		items?: unknown;
	};
}): Record<string, unknown> {
	const { startDate, dueDate, reminders, tags, items, ...rest } = values;
	const reminderList = toStringArray({ value: reminders });
	const tagList = toStringArray({ value: tags });
	const defined = Object.fromEntries(
		Object.entries(rest).filter(([, value]) => value !== undefined && value !== ''),
	);
	return {
		...defined,
		...(startDate ? { startDate: formatDate({ value: startDate }) } : {}),
		...(dueDate ? { dueDate: formatDate({ value: dueDate }) } : {}),
		...(reminderList && reminderList.length > 0 ? { reminders: reminderList } : {}),
		...(tagList && tagList.length > 0 ? { tags: tagList } : {}),
		...(Array.isArray(items) ? { items } : {}),
	};
}

export const taskFields = { taskFieldProps, formatDate, toStringArray, buildTaskFields };
