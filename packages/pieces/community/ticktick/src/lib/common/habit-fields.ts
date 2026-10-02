import { Property } from '@activepieces/pieces-framework';
import { taskFields } from './task-fields';

function habitFieldProps() {
	return {
		iconRes: Property.ShortText({
			displayName: 'Icon',
			description: 'Habit icon resource, for example "habit_reading".',
			required: false,
		}),
		color: Property.ShortText({
			displayName: 'Color',
			description: 'Hex color, for example "#4D8CF5".',
			required: false,
		}),
		sortOrder: Property.Number({
			displayName: 'Sort Order',
			required: false,
		}),
		encouragement: Property.ShortText({
			displayName: 'Encouragement',
			description: 'Encouragement message shown for the habit.',
			required: false,
		}),
		type: Property.ShortText({
			displayName: 'Type',
			description: '"Boolean" for done or not done, "Real" for a numeric goal.',
			required: false,
		}),
		goal: Property.Number({
			displayName: 'Goal',
			description: 'Daily goal, for example 1 for a Boolean habit.',
			required: false,
		}),
		step: Property.Number({
			displayName: 'Step',
			description: 'Amount added per check-in tap.',
			required: false,
		}),
		unit: Property.ShortText({
			displayName: 'Unit',
			description: 'Goal unit, for example "Count".',
			required: false,
		}),
		repeatRule: Property.ShortText({
			displayName: 'Repeat Rule',
			description: 'Recurrence rule, for example "RRULE:FREQ=DAILY;INTERVAL=1".',
			required: false,
		}),
		reminders: Property.Array({
			displayName: 'Reminders',
			description: 'Reminder times, for example "08:00".',
			required: false,
		}),
		recordEnable: Property.StaticDropdown({
			displayName: 'Record Enabled',
			description: 'Whether check-in notes (records) are enabled.',
			required: false,
			options: {
				options: [
					{ label: 'Yes', value: true },
					{ label: 'No', value: false },
				],
			},
		}),
		sectionId: Property.ShortText({
			displayName: 'Section ID',
			description: 'The habit section ID, from the List Habit Sections action.',
			required: false,
		}),
		targetDays: Property.Number({
			displayName: 'Target Days',
			required: false,
		}),
		targetStartDate: Property.Number({
			displayName: 'Target Start Date',
			description: 'Start date as YYYYMMDD, for example 20240101.',
			required: false,
		}),
	};
}

function buildHabitFields({
	values,
}: {
	values: {
		name?: string;
		iconRes?: string;
		color?: string;
		sortOrder?: number;
		encouragement?: string;
		type?: string;
		goal?: number;
		step?: number;
		unit?: string;
		repeatRule?: string;
		reminders?: unknown;
		recordEnable?: boolean;
		sectionId?: string;
		targetDays?: number;
		targetStartDate?: number;
	};
}): Record<string, unknown> {
	const { reminders, ...rest } = values;
	const reminderList = taskFields.toStringArray({ value: reminders });
	const defined = Object.fromEntries(
		Object.entries(rest).filter(([, value]) => value !== undefined && value !== ''),
	);
	return {
		...defined,
		...(reminderList ? { reminders: reminderList } : {}),
	};
}

export const habitFields = { habitFieldProps, buildHabitFields };
