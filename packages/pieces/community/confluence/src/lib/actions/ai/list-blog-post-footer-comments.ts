import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceListBlogPostFooterCommentsOutputSchema } from '../../output-schemas';

export const listBlogPostFooterCommentsAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_list_blog_post_footer_comments',
	outputSchema: confluenceListBlogPostFooterCommentsOutputSchema,
	displayName: 'List Blog Post Footer Comments',
	description: 'Lists the footer on a blog post.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the top-level footer (bottom-of-page) comments on a Confluence blog post with their bodies. Use the comment IDs to reply, update or delete. Pass nextCursor back as Cursor for the next page.',
		idempotent: true,
	},
	props: {
		blogPostId: confluenceAiProps.blogPostId({ required: true }),
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
		const { blogPostId, bodyFormat, sort, limit, cursor } = context.propsValue;
		return await confluenceApi.listContentChildren({
			auth: context.auth,
			contentType: 'blogposts',
			contentId: blogPostId,
			relation: 'footer-comments',
			query: { 'body-format': bodyFormat ?? 'storage', sort, limit, cursor },
		});
	},
});
