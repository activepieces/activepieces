import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceListBlogPostInlineCommentsOutputSchema } from '../../output-schemas';

export const listBlogPostInlineCommentsAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_list_blog_post_inline_comments',
	outputSchema: confluenceListBlogPostInlineCommentsOutputSchema,
	displayName: 'List Blog Post Inline Comments',
	description: 'Lists the inline comments on a blog post.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the top-level inline comments (attached to highlighted text) on a Confluence blog post with their bodies. Use the comment IDs to reply, update or delete. Pass nextCursor back as Cursor for the next page.',
		idempotent: true,
	},
	props: {
		blogPostId: confluenceAiProps.blogPostId({ required: true }),
		resolutionStatus: Property.StaticDropdown({
			displayName: 'Resolution Status',
			description: 'Only comments with this resolution status.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Open', value: 'open' },
					{ label: 'Resolved', value: 'resolved' },
					{ label: 'Reopened', value: 'reopened' },
					{ label: 'Dangling (highlighted text removed)', value: 'dangling' },
				],
			},
		}),
		bodyFormat: confluenceAiProps.readBodyFormat({ required: false }),
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
		limit: confluenceAiProps.limit({ required: false }),
		cursor: confluenceAiProps.cursor({ required: false }),
	},
	async run(context) {
		const { blogPostId, bodyFormat, sort, limit, cursor, resolutionStatus } = context.propsValue;
		return await confluenceApi.listContentChildren({
			auth: context.auth,
			contentType: 'blogposts',
			contentId: blogPostId,
			relation: 'inline-comments',
			query: {
				'body-format': bodyFormat ?? 'storage',
				sort,
				'resolution-status': resolutionStatus,
				limit,
				cursor,
			},
		});
	},
});
