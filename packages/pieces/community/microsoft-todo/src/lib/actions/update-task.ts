import { Property, createAction, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { getTaskListsDropdown, getTasksInListDropdown } from '../common';
import { microsoftToDoAuth } from '../../index';
import { Client } from '@microsoft/microsoft-graph-client';
import { Importance, TaskStatus, TodoTask } from '@microsoft/microsoft-graph-types';

export const updateTaskAction = createAction({
	auth: microsoftToDoAuth,
	name: 'update_task',
	displayName: 'Update Task',
	description: 'Update an existing task.',
	props: {
		task_list_id: Property.Dropdown({
			displayName: 'Task List',
			description: 'The task list containing the task to update.',
			required: true,
			refreshers: [],
			options: async ({ auth }) => {
				if (!(auth as OAuth2PropertyValue)?.access_token) {
					return { disabled: true, placeholder: 'Connect your account first', options: [] };
				}
				return await getTaskListsDropdown(auth as OAuth2PropertyValue);
			},
		}),
		task_id: Property.Dropdown({
			displayName: 'Task',
			description: 'The task to update.',
			required: true,
			refreshers: ['task_list_id'],
			options: async ({ auth, task_list_id }) => {
				const authValue = auth as OAuth2PropertyValue;
				if (!authValue?.access_token || !task_list_id) {
					return {
						disabled: true,
						placeholder: !authValue?.access_token
							? 'Connect your account first'
							: 'Select a task list first',
						options: [],
					};
				}
				return await getTasksInListDropdown(authValue, task_list_id as string);
			},
		}),
		title: Property.ShortText({
			displayName: 'Title',
			description: 'The title of the task.',
			required: false,
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
			task_id,
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

		if (categories && categories !== '') {
			taskBody.categories = categories
				.split(',')
				.map((c) => c.trim())
				.filter((c) => c.length > 0);
		}

		// Only send request if there's something to update
		if (Object.keys(taskBody).length === 0) {
			// Optionally return the existing task or a message, or fetch and return task if ID is present
			// For now, just return a message or do nothing if nothing to update.
			// However, a PATCH with empty body might be treated as bad request by some APIs.
			// Microsoft Graph usually ignores fields not present, so an empty body PATCH might be a no-op.
			// Best to ensure at least one field is being modified or return early.
			// Let's assume for now the user intends a no-op if all update fields are blank,
			// but this might need a more specific behavior (e.g. fetch current task data).
			// For safety, if requestBody is empty, we could fetch the task and return it.
			// For now, let's proceed with the PATCH, it should be a no-op by MS Graph if body is empty.
			throw new Error('Please provide any field to update.');
		}

		const response = await client
			.api(`/me/todo/lists/${task_list_id}/tasks/${task_id}`)
			.update(taskBody);

		return response;
	},
});
