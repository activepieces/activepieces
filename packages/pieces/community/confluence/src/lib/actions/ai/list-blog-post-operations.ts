import { createAction } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceListBlogPostOperationsOutputSchema } from '../../output-schemas';

export const listBlogPostOperationsAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_list_blog_post_operations',
	outputSchema: confluenceListBlogPostOperationsOutputSchema,
	displayName: 'List Blog Post Permitted Operations',
	description: 'Lists what the connected user may do on a blog post.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Lists the operations (read, update, delete and so on) the connected user is permitted to perform on a Confluence blog post. Use it to check access before trying a write.',
		idempotent: true,
	},
	props: {
		blogPostId: confluenceAiProps.blogPostId({ required: true }),
	},
	async run(context) {
		return await confluenceApi.listContentOperations({
			auth: context.auth,
			contentType: 'blogposts',
			contentId: context.propsValue.blogPostId,
		});
	},
});
