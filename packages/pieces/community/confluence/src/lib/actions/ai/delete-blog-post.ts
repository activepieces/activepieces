import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceDeleteBlogPostOutputSchema } from '../../output-schemas';

export const deleteBlogPostAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_delete_blog_post',
	outputSchema: confluenceDeleteBlogPostOutputSchema,
	displayName: 'Delete Blog Post',
	description: 'Moves a blog post to the trash, or purges it.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Deletes a Confluence blog post by ID. By default it moves it to the trash (recoverable); Purge permanently removes a blog post that is already in the trash, and Draft deletes an unpublished draft. Not idempotent: deleting again returns an error.',
		idempotent: false,
	},
	props: {
		blogPostId: confluenceAiProps.blogPostId({ required: true }),
		purge: Property.Checkbox({
			displayName: 'Purge',
			description: 'Permanently delete a blog post that is already in the trash. Cannot be undone.',
			required: false,
		}),
		draft: Property.Checkbox({
			displayName: 'Draft',
			description: 'Delete the unpublished draft of the blog post.',
			required: false,
		}),
	},
	async run(context) {
		const { blogPostId, purge, draft } = context.propsValue;
		await confluenceApi.deleteContent({
			auth: context.auth,
			contentType: 'blogposts',
			contentId: blogPostId,
			query: { purge: purge || undefined, draft: draft || undefined },
		});
		return { deleted: true, blogPostId };
	},
});
