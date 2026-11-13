import { createAction } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceListBlogPostPropertiesOutputSchema } from '../../output-schemas';

export const listBlogPostPropertiesAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_list_blog_post_properties',
	outputSchema: confluenceListBlogPostPropertiesOutputSchema,
	displayName: 'List Blog Post Properties',
	description: 'Lists the content properties stored on a blog post.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the content properties (key/value JSON metadata) stored on a Confluence blog post, optionally filtered by key. Each result has the property ID and version that Update Blog Post Property needs. Pass nextCursor back as Cursor for the next page.',
		idempotent: true,
	},
	props: {
		blogPostId: confluenceAiProps.blogPostId({ required: true }),
		key: confluenceAiProps.propertyKey({
			required: false,
			description: 'Only the property with this key.',
		}),
		limit: confluenceAiProps.limit({ required: false }),
		cursor: confluenceAiProps.cursor({ required: false }),
	},
	async run(context) {
		const { blogPostId, key, limit, cursor } = context.propsValue;
		return await confluenceApi.listContentChildren({
			auth: context.auth,
			contentType: 'blogposts',
			contentId: blogPostId,
			relation: 'properties',
			query: { key, limit, cursor },
		});
	},
});
