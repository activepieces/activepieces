import { createAction, Property, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { teamworkAuth } from '../common/auth';
import { teamworkRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createTimeEntryOnTask = createAction({
	name: 'create_time_entry_on_task',
	displayName: 'Create Time Entry on Task',
	description: 'Log time spent on a task with duration, description.',
	auth: teamworkAuth,
	props: {
		taskId: Property.Dropdown({
			displayName: 'Task',
			required: true,
			refreshers: [],
			options: async ({ auth }) => {
				if (!auth) {
					return {
						disabled: true,
						placeholder: 'Please authenticate first.',
						options: [],
					};
				}
				const res = await teamworkRequest(auth as PiecePropValueSchema<typeof teamworkAuth>, {
					method: HttpMethod.GET,
					path: '/tasks.json',
				});
				const options = res.data['todo-items'].map((task: { id: string; content: string }) => ({
					label: task.content,
					value: task.id,
				}));
				return {
					disabled: false,
					options,
				};
			},
		}),
		date: Property.DateTime({
			displayName: 'Date',
			description: 'Date of the time entry (yyyy-mm-dd)',
			required: true,
		}),
		time: Property.ShortText({
			displayName: 'Time',
			description: 'Time of the entry (hh:mm:ss)',
			required: false,
		}),
		hours: Property.Number({
			displayName: 'Hours',
			required: true,
		}),
		minutes: Property.Number({
			displayName: 'Minutes',
			description: 'Duration in minutes',
			required: true,
		}),
		description: Property.LongText({
			displayName: 'Description',
			required: false,
		}),
		isBillable: Property.Checkbox({
			displayName: 'Is Billable',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		const date = new Date(propsValue.date).toISOString().slice(0, 10);
		const body = {
			timelog: {
				date: date,
				time: propsValue.time,
				description: propsValue.description,
				hasStartTime: !!propsValue.time,
				hours: propsValue.hours,
				minutes: propsValue.minutes,
				isBillable: propsValue.isBillable,
			},
		};
		return await teamworkRequest(auth, {
			method: HttpMethod.POST,
			path: `/projects/api/v3/tasks/${propsValue.taskId}/time.json`,
			body,
		});
	},
});


