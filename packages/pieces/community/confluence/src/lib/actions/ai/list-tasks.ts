import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceListTasksOutputSchema } from '../../output-schemas';

export const listTasksAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_list_tasks',
	outputSchema: confluenceListTasksOutputSchema,
	displayName: 'List Tasks',
	description: 'Lists inline tasks, filtered by status, space, page or assignee.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists Confluence inline tasks (checklist items on pages and blog posts), filtered by status, space, page, assignee or creator account ID. Use Update Task to complete or reopen one. Pass nextCursor back as Cursor, with the same filters, to get the next page.',
		idempotent: true,
	},
	props: {
		status: Property.StaticDropdown({
			displayName: 'Status',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Incomplete', value: 'incomplete' },
					{ label: 'Complete', value: 'complete' },
				],
			},
		}),
		spaceId: confluenceAiProps.spaceId({
			required: false,
			description: 'Only tasks in this space. Numeric space ID from List Spaces.',
		}),
		pageId: confluenceAiProps.pageId({ required: false, description: 'Only tasks on this page.' }),
		assignedTo: Property.ShortText({
			displayName: 'Assigned To',
			description: 'Only tasks assigned to this account ID, from Get Current User or Find User.',
			required: false,
		}),
		createdBy: Property.ShortText({
			displayName: 'Created By',
			description: 'Only tasks created by this account ID.',
			required: false,
		}),
		limit: confluenceAiProps.limit({ required: false }),
		cursor: confluenceAiProps.cursor({ required: false }),
	},
	async run(context) {
		const { status, spaceId, pageId, assignedTo, createdBy, limit, cursor } = context.propsValue;
		return await confluenceApi.listTasksPage({
			auth: context.auth,
			query: {
				status,
				'space-id': spaceId,
				'page-id': pageId,
				'assigned-to': assignedTo,
				'created-by': createdBy,
				'body-format': 'storage',
				limit,
				cursor,
			},
		});
	},
});
