import { createAction } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceDeleteBlogPostPropertyOutputSchema } from '../../output-schemas';

export const deleteBlogPostPropertyAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_delete_blog_post_property',
	outputSchema: confluenceDeleteBlogPostPropertyOutputSchema,
	displayName: 'Delete Blog Post Property',
	description: 'Deletes a content property from a blog post.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes a content property from a Confluence blog post. Get the property ID from List Blog Post Properties. Not idempotent: deleting again returns an error.',
		idempotent: false,
	},
	props: {
		blogPostId: confluenceAiProps.blogPostId({ required: true }),
		propertyId: confluenceAiProps.propertyId({ required: true }),
	},
	async run(context) {
		const { blogPostId, propertyId } = context.propsValue;
		await confluenceApi.deleteContentProperty({
			auth: context.auth,
			contentType: 'blogposts',
			contentId: blogPostId,
			propertyId,
		});
		return { deleted: true, propertyId };
	},
});
