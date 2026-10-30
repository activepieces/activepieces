import { createAction } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceGetBlogPostLikeCountOutputSchema } from '../../output-schemas';

export const getBlogPostLikeCountAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_get_blog_post_like_count',
	outputSchema: confluenceGetBlogPostLikeCountOutputSchema,
	displayName: 'Get Blog Post Like Count',
	description: 'Gets how many likes a blog post has.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Returns the number of likes on a Confluence blog post.',
		idempotent: true,
	},
	props: {
		blogPostId: confluenceAiProps.blogPostId({ required: true }),
	},
	async run(context) {
		return await confluenceApi.getContentLikeCount({
			auth: context.auth,
			contentType: 'blogposts',
			contentId: context.propsValue.blogPostId,
		});
	},
});
