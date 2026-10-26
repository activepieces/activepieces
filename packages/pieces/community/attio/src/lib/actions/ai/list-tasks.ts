import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { attioAuth } from '../../auth';
import { attioApiCall } from '../../common/client';
import { attioAi } from '../../common/ai';
import { attioListTasksOutputSchema } from '../../output-schemas';

export const attioListTasksAction = createAction({
	auth: attioAuth,
	name: 'attio_list_tasks',
	outputSchema: attioListTasksOutputSchema,
	displayName: 'List Tasks',
	description: 'Lists tasks, with optional filters.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description: 'Lists tasks, optionally filtered by linked record, assignee or completion, and sorted by creation or completion date.',
		idempotent: true,
	},
	props: {
		linked_object: Property.ShortText({ displayName: 'Linked Object', description: 'Object slug, e.g. `people`. Use with Linked Record ID.', required: false }),
		linked_record_id: Property.ShortText({ displayName: 'Linked Record ID', required: false }),
		assignee: Property.ShortText({ displayName: 'Assignee', description: 'Workspace member email or ID.', required: false }),
		is_completed: attioAi.optionalBooleanProp({ displayName: 'Completed', description: 'Leave empty for all tasks.' }),
		sort: Property.StaticDropdown({
			displayName: 'Sort',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Created (oldest first)', value: 'created_at:asc' },
					{ label: 'Created (newest first)', value: 'created_at:desc' },
					{ label: 'Completed (oldest first)', value: 'completed_at:asc' },
					{ label: 'Completed (newest first)', value: 'completed_at:desc' },
				],
			},
		}),
		limit: attioAi.limitProp({ max: 500 }),
		offset: attioAi.offsetProp(),
	},
	async run(context) {
		const { linked_object, linked_record_id, assignee, is_completed, sort, limit, offset } = context.propsValue;
		const response = await attioApiCall<{ data: Record<string, unknown>[] }>({
			accessToken: context.auth.secret_text,
			method: HttpMethod.GET,
			resourceUri: `/tasks`,
			query: { linked_object, linked_record_id, assignee, is_completed, sort, limit, offset },
		});
		return { tasks: response.data, count: response.data.length };
	},
});
