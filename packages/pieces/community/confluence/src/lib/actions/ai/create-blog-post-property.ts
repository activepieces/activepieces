import { createAction } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceCreateBlogPostPropertyOutputSchema } from '../../output-schemas';

export const createBlogPostPropertyAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_create_blog_post_property',
	outputSchema: confluenceCreateBlogPostPropertyOutputSchema,
	displayName: 'Create Blog Post Property',
	description: 'Stores a new content property on a blog post.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Stores a new content property (a key with a JSON value) on a Confluence blog post. Fails if the key already exists there; use Update Blog Post Property to change it. Not idempotent.',
		idempotent: false,
	},
	props: {
		blogPostId: confluenceAiProps.blogPostId({ required: true }),
		key: confluenceAiProps.propertyKey({ required: true }),
		value: confluenceAiProps.propertyValue({ required: true }),
	},
	async run(context) {
		const { blogPostId, key, value } = context.propsValue;
		return await confluenceApi.createContentProperty({
			auth: context.auth,
			contentType: 'blogposts',
			contentId: blogPostId,
			key,
			value,
		});
	},
});
