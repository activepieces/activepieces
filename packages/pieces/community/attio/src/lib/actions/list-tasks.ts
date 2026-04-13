import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../auth';
import { attioApiCall } from '../common/client';
import { linkedRecordDropdown, objectTypeIdDropdown } from '../common/props';

export const listTasksAction = createAction({
	auth: attioAuth,
	name: 'list_tasks',
	displayName: 'List Tasks',
	description: 'List tasks with optional filters by linked record, assignee, or completion status.',
	props: {
		linked_object: objectTypeIdDropdown({
			displayName: 'Linked Object',
			description: 'Filter tasks linked to records of this object type.',
			required: false,
		}),
		linked_record_id: linkedRecordDropdown({
			displayName: 'Linked Record',
			description: 'Filter tasks linked to this specific record.',
			required: false,
		}),
		assignee: Property.ShortText({
			displayName: 'Assignee',
			description:
				'Filter by workspace member email or ID. Enter "null" to find unassigned tasks.',
			required: false,
		}),
		is_completed: Property.StaticDropdown({
			displayName: 'Completion Status',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'All', value: 'all' },
					{ label: 'Completed', value: 'true' },
					{ label: 'Incomplete', value: 'false' },
				],
			},
		}),
	},
	async run(context) {
		const { linked_object, linked_record_id, assignee, is_completed } = context.propsValue;

		const query: Record<string, string | number | undefined> = {
			limit: 500,
			offset: 0,
		};

		if (linked_object) query['linked_object'] = linked_object;
		if (linked_record_id) query['linked_record_id'] = linked_record_id;
		if (assignee) query['assignee'] = assignee;
		if (is_completed && is_completed !== 'all') query['is_completed'] = is_completed;

		const response = await attioApiCall<{ data: Array<Record<string, unknown>> }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: '/tasks',
			query,
		});

		return {
			found: response.data.length > 0,
			result: response.data,
		};
	},
});
