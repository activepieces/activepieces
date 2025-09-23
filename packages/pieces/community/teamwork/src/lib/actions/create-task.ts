import { createAction, Property } from '@activepieces/pieces-framework';
import { teamworkAuth } from '../common/auth';
import { teamworkRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createTask = createAction({
	name: 'create_task',
	displayName: 'Create Task',
	description: 'Create a new task in a task list',
	auth: teamworkAuth,
	props: {
		taskListId: Property.ShortText({ displayName: 'Task List ID', required: true }),
		title: Property.ShortText({ displayName: 'Title', required: true }),
		description: Property.LongText({ displayName: 'Description', required: false }),
		dueDate: Property.ShortText({ displayName: 'Due Date (YYYYMMDD)', required: false }),
		assigneeId: Property.ShortText({ displayName: 'Assignee ID', required: false }),
		priority: Property.Number({ displayName: 'Priority (1-5)', required: false }),
	},
	async run({ auth, propsValue }) {
		const body = {
			todoitem: {
				content: propsValue.title,
				description: propsValue.description,
				responsiblePartyId: propsValue.assigneeId,
				priority: propsValue.priority,
				// Teamwork expects dates as YYYYMMDD
				dueDate: propsValue.dueDate,
			},
		};
		return await teamworkRequest(auth, {
			method: HttpMethod.POST,
			path: `/tasklists/${propsValue.taskListId}/tasks.json`,
			body,
		});
	},
});


