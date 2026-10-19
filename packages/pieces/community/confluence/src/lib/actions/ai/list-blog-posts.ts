import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceListBlogPostsOutputSchema } from '../../output-schemas';

export const listBlogPostsAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_list_blog_posts',
	outputSchema: confluenceListBlogPostsOutputSchema,
	displayName: 'List Blog Posts',
	description: 'Lists blog posts, optionally filtered by space, title or status.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists Confluence blog posts one page of results at a time, filtered by space ID, exact title and status. Use Search Content for full-text queries. Pass nextCursor back as Cursor, with the same filters, to get the next page.',
		idempotent: true,
	},
	props: {
		spaceId: confluenceAiProps.spaceId({
			required: false,
			description:
				'Only blog posts in this space. Numeric space ID from List Spaces; several IDs may be comma-separated.',
		}),
		title: Property.ShortText({
			displayName: 'Title',
			description: 'Only blog posts with exactly this title.',
			required: false,
		}),
		status: Property.StaticDropdown({
			displayName: 'Status',
			description: 'Only blog posts with this status. Defaults to current.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Current', value: 'current' },
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
				],
			},
		}),
		bodyFormat: confluenceAiProps.readBodyFormat({ required: false }),
		limit: confluenceAiProps.limit({ required: false }),
		cursor: confluenceAiProps.cursor({ required: false }),
	},
	async run(context) {
		const { spaceId, title, status, sort, bodyFormat, limit, cursor } = context.propsValue;
		return await confluenceApi.listBlogPostsPage({
			auth: context.auth,
			query: { 'space-id': spaceId, title, status, sort, 'body-format': bodyFormat, limit, cursor },
		});
	},
});
