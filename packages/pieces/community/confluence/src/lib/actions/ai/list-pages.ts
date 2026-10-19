import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceListPagesOutputSchema } from '../../output-schemas';

export const listPagesAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_list_pages',
	outputSchema: confluenceListPagesOutputSchema,
	displayName: 'List Pages',
	description: 'Lists pages, optionally filtered by space, title or status.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists Confluence pages one page of results at a time, filtered by space ID, exact title and status. Use it to find a page ID by title or to browse a space; use Search Content for full-text or CQL queries. Pass nextCursor back as Cursor, with the same filters, to get the next page.',
		idempotent: true,
	},
	props: {
		spaceId: confluenceAiProps.spaceId({
			required: false,
			description:
				'Only pages in this space. Numeric space ID from List Spaces; several IDs may be comma-separated.',
		}),
		title: Property.ShortText({
			displayName: 'Title',
			description: 'Only pages with exactly this title.',
			required: false,
		}),
		status: Property.StaticDropdown({
			displayName: 'Status',
			description: 'Only pages with this status. Defaults to current and archived.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Current', value: 'current' },
					{ label: 'Archived', value: 'archived' },
					{ label: 'Trashed', value: 'trashed' },
					{ label: 'Deleted', value: 'deleted' },
				],
			},
		}),
		sort: Property.StaticDropdown({
			displayName: 'Sort',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Newest first', value: '-created-date' },
					{ label: 'Oldest first', value: 'created-date' },
					{ label: 'Recently modified first', value: '-modified-date' },
					{ label: 'Title A-Z', value: 'title' },
				],
			},
		}),
		bodyFormat: confluenceAiProps.readBodyFormat({ required: false }),
		limit: confluenceAiProps.limit({ required: false }),
		cursor: confluenceAiProps.cursor({ required: false }),
	},
	async run(context) {
		const { spaceId, title, status, sort, bodyFormat, limit, cursor } = context.propsValue;
		return await confluenceApi.listPagesPage({
			auth: context.auth,
			query: { 'space-id': spaceId, title, status, sort, 'body-format': bodyFormat, limit, cursor },
		});
	},
});
