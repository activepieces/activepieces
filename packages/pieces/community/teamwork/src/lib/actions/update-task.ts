import { createAction, Property } from '@activepieces/pieces-framework';
import { teamworkAuth } from '../common/auth';
import { teamworkRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const updateTask = createAction({
	name: 'update_task',
	displayName: 'Update Task',
	description: 'Update a Teamwork task by ID',
	auth: teamworkAuth,
	props: {
		taskId: Property.ShortText({ displayName: 'Task ID', required: true }),
		title: Property.ShortText({ displayName: 'Title', required: false }),
		description: Property.LongText({ displayName: 'Description', required: false }),
		dueDate: Property.ShortText({ displayName: 'Due Date (YYYYMMDD)', required: false }),
		assigneeId: Property.ShortText({ displayName: 'Assignee ID', required: false }),
		priority: Property.Number({ displayName: 'Priority (1-5)', required: false }),
	},
	async run({ auth, propsValue }) {
		const body: any = { todoitem: {} };
		if (propsValue.title) body.todoitem.content = propsValue.title;
		if (propsValue.description) body.todoitem.description = propsValue.description;
		if (propsValue.dueDate) body.todoitem.dueDate = propsValue.dueDate;
		if (propsValue.assigneeId) body.todoitem.responsiblePartyId = propsValue.assigneeId;
		if (propsValue.priority !== undefined) body.todoitem.priority = propsValue.priority;
		return await teamworkRequest(auth, { method: HttpMethod.PUT, path: `/tasks/${propsValue.taskId}.json`, body });
	},
});


