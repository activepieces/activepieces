import { createAction } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceCreateBlogPostPropertyOutputSchema } from '../../output-schemas';

export const updateBlogPostPropertyAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_update_blog_post_property',
	outputSchema: confluenceCreateBlogPostPropertyOutputSchema,
	displayName: 'Update Blog Post Property',
	description: 'Replaces the value of a content property on a blog post.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Replaces the JSON value of an existing content property on a Confluence blog post, saving it as the next version; the key is kept unless you set a new one. Get the property ID from List Blog Post Properties. Idempotent: setting the same value again leaves it unchanged.',
		idempotent: true,
	},
	props: {
		blogPostId: confluenceAiProps.blogPostId({ required: true }),
		propertyId: confluenceAiProps.propertyId({ required: true }),
		value: confluenceAiProps.propertyValue({
			required: true,
			description: 'New JSON object or array; replaces the current value.',
		}),
		key: confluenceAiProps.propertyKey({
			required: false,
			description: 'New key. Leave empty to keep the current key.',
		}),
	},
	async run(context) {
		const { blogPostId, propertyId, value, key } = context.propsValue;
		const current = await confluenceApi.getContentProperty({
			auth: context.auth,
			contentType: 'blogposts',
			contentId: blogPostId,
			propertyId,
		});
		return await confluenceApi.updateContentProperty({
			auth: context.auth,
			contentType: 'blogposts',
			contentId: blogPostId,
			propertyId,
			key: key ?? current.key,
			value,
			versionNumber: current.version.number + 1,
		});
	},
});
