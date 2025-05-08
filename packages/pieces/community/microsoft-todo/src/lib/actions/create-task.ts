import { Property, createAction, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { getTaskListsDropdown } from '../common';
import { microsoftToDoAuth } from '../../index';
import { Client } from '@microsoft/microsoft-graph-client';
import { Importance, TaskStatus, TodoTask } from '@microsoft/microsoft-graph-types';

export const createTask = createAction({
	auth: microsoftToDoAuth,
	name: 'create_task',
	displayName: 'Create Task',
	description: 'Creates a new task.',
	props: {
		task_list_id: Property.Dropdown({
			displayName: 'Task List',
			description: 'The task list to create the task in.',
			required: true,
			refreshers: [],
			options: async ({ auth }) => {
				if (!(auth as OAuth2PropertyValue)?.access_token) {
					return {
						disabled: true,
						placeholder: 'Connect your account first',
						options: [],
					};
				}
				return await getTaskListsDropdown(auth as OAuth2PropertyValue);
			},
		}),
		title: Property.ShortText({
			displayName: 'Title',
			description: 'The title of the task.',
			required: true,
		}),
		body_content: Property.LongText({
			displayName: 'Body Content',
			description: 'The body or notes for the task.',
			required: false,
		}),
		importance: Property.StaticDropdown({
			displayName: 'Importance',
			description: 'The importance of the task.',
			required: false,
			options: {
				options: [
					{ label: 'Low', value: 'low' },
					{ label: 'Normal', value: 'normal' },
					{ label: 'High', value: 'high' },
				],
			},
		}),
		status: Property.StaticDropdown({
			displayName: 'Status',
			description: 'The status of the task.',
			required: false,
			options: {
				options: [
					{ label: 'Not Started', value: 'notStarted' },
					{ label: 'In Progress', value: 'inProgress' },
					{ label: 'Completed', value: 'completed' },
					{ label: 'Waiting On Others', value: 'waitingOnOthers' },
					{ label: 'Deferred', value: 'deferred' },
				],
			},
			defaultValue: 'notStarted',
		}),
		due_date_time: Property.DateTime({
			displayName: 'Due Date',
			required: false,
		}),
		reminder_date_time: Property.DateTime({
			displayName: 'Reminder Date',
			required: false,
		}),
		start_date_time: Property.DateTime({
			displayName: 'Start Date',
			description: 'The date and time the task is scheduled to start.',
			required: false,
		}),
		categories: Property.ShortText({
			displayName: 'Categories',
			description: 'Comma-separated categories for the task (e.g., Work, Personal).',
			required: false,
		}),
	},
	async run(context) {
		const { auth, propsValue } = context;
		const {
			task_list_id,
			title,
			body_content,
			importance,
			status,
			due_date_time,
			reminder_date_time,
			start_date_time,
			categories,
		} = propsValue;

		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(auth.access_token),
			},
		});

		const taskBody: TodoTask = {
			title,
		};

		if (body_content) {
			taskBody.body = {
				content: body_content,
				contentType: 'text',
			};
		}

		if (importance) {
			taskBody.importance = importance as Importance;
		}

		if (status) {
			taskBody.status = status as TaskStatus;
		}

		if (due_date_time) {
			taskBody.dueDateTime = {
				dateTime: due_date_time,
				timeZone: 'UTC',
			};
		}

		if (reminder_date_time) {
			taskBody.isReminderOn = true;
			taskBody.reminderDateTime = { dateTime: reminder_date_time, timeZone: 'UTC' };
		}

		if (start_date_time) {
			taskBody.startDateTime = { dateTime: start_date_time, timeZone: 'UTC' };
		}

		if (categories) {
			taskBody.categories = categories
				.split(',')
				.map((c) => c.trim())
				.filter((c) => c.length > 0);
		}

		const response = await client.api(`/me/todo/lists/${task_list_id}/tasks`).post(taskBody);

		return response;
	},
});
