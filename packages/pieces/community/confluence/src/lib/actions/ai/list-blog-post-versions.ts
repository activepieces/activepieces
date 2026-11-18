import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceListBlogPostVersionsOutputSchema } from '../../output-schemas';

export const listBlogPostVersionsAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_list_blog_post_versions',
	outputSchema: confluenceListBlogPostVersionsOutputSchema,
	displayName: 'List Blog Post Versions',
	description: 'Lists the version history of a blog post.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the versions of a Confluence blog post with their number, author, date and message. Use the version number with Get Blog Post Version or Restore Page Version. Pass nextCursor back as Cursor for the next page.',
		idempotent: true,
	},
	props: {
		blogPostId: confluenceAiProps.blogPostId({ required: true }),
		sort: Property.StaticDropdown({
			displayName: 'Sort',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Newest first', value: '-modified-date' },
					{ label: 'Oldest first', value: 'modified-date' },
				],
			},
		}),
		bodyFormat: confluenceAiProps.readBodyFormat({ required: false }),
		limit: confluenceAiProps.limit({ required: false }),
		cursor: confluenceAiProps.cursor({ required: false }),
	},
	async run(context) {
		const { blogPostId, sort, bodyFormat, limit, cursor } = context.propsValue;
		return await confluenceApi.listContentChildren({
			auth: context.auth,
			contentType: 'blogposts',
			contentId: blogPostId,
			relation: 'versions',
			query: { sort, 'body-format': bodyFormat, limit, cursor },
		});
	},
});
