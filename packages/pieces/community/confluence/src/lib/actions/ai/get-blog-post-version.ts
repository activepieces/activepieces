import { createAction } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceGetBlogPostVersionOutputSchema } from '../../output-schemas';

export const getBlogPostVersionAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_get_blog_post_version',
	outputSchema: confluenceGetBlogPostVersionOutputSchema,
	displayName: 'Get Blog Post Version',
	description: 'Gets the details of one version of a blog post.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets the details of one version of a Confluence blog post: author, date, message, minor-edit flag and the neighbouring versions. Get version numbers from List Blog Post Versions.',
		idempotent: true,
	},
	props: {
		blogPostId: confluenceAiProps.blogPostId({ required: true }),
		versionNumber: confluenceAiProps.versionNumber({ required: true }),
	},
	async run(context) {
		const { blogPostId, versionNumber } = context.propsValue;
		return await confluenceApi.getContentVersion({
			auth: context.auth,
			contentType: 'blogposts',
			contentId: blogPostId,
			versionNumber,
		});
	},
});
