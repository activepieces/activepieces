import { createAction, Property } from '@activepieces/pieces-framework';
import { teamworkAuth } from '../common/auth';
import { teamworkRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createTimeEntryOnTask = createAction({
	name: 'create_time_entry_on_task',
	displayName: 'Create Time Entry on Task',
	description: 'Log time against a task',
	auth: teamworkAuth,
	props: {
		taskId: Property.ShortText({ displayName: 'Task ID', required: true }),
		hours: Property.Number({ displayName: 'Hours', required: true }),
		date: Property.ShortText({ displayName: 'Date (YYYYMMDD)', required: true }),
		description: Property.LongText({ displayName: 'Description', required: false }),
	},
	async run({ auth, propsValue }) {
		const body = {
			'time-entry': {
				'task-id': propsValue.taskId,
				hours: propsValue.hours,
				date: propsValue.date,
				description: propsValue.description,
			},
		};
		return await teamworkRequest(auth, { method: HttpMethod.POST, path: `/time_entries.json`, body });
	},
});


