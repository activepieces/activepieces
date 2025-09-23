import { createAction, Property } from '@activepieces/pieces-framework';
import { teamworkAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { teamworkRequest } from '../common/client';

export const createTaskList = createAction({
	name: 'create_task_list',
	displayName: 'Create Task List',
	description: 'Create a new task list in a project',
	auth: teamworkAuth,
	props: {
		projectId: Property.ShortText({ displayName: 'Project ID', required: true }),
		title: Property.ShortText({ displayName: 'Title', required: true }),
		description: Property.LongText({ displayName: 'Description', required: false }),
	},
	async run({ auth, propsValue }) {
		const body = {
			todolist: {
				name: propsValue.title,
				description: propsValue.description,
			},
		};
		return await teamworkRequest(auth, {
			method: HttpMethod.POST,
			path: `/projects/${propsValue.projectId}/tasklists.json`,
			body,
		});
	},
});


