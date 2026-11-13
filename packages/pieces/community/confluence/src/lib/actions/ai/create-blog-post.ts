import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceCreateBlogPostOutputSchema } from '../../output-schemas';

export const createBlogPostAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_create_blog_post',
	outputSchema: confluenceCreateBlogPostOutputSchema,
	displayName: 'Create Blog Post',
	description: 'Creates a blog post in a space.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a Confluence blog post in a space, published or as a draft. Get the space ID from List Spaces. Not idempotent: each call creates another blog post.',
		idempotent: false,
	},
	props: {
		spaceId: confluenceAiProps.spaceId({ required: true }),
		title: Property.ShortText({ displayName: 'Title', required: true }),
		body: confluenceAiProps.body({ required: false }),
		bodyFormat: confluenceAiProps.bodyFormat({ required: false }),
		status: confluenceAiProps.contentStatus({
			required: false,
			description: 'Published (current) or draft. Defaults to published.',
		}),
		isPrivate: Property.Checkbox({
			displayName: 'Private',
			description: 'Restrict the blog post so only you can view and edit it.',
			required: false,
		}),
	},
	async run(context) {
		const { spaceId, title, body, bodyFormat, status, isPrivate } = context.propsValue;
		return await confluenceApi.createBlogPost({
			auth: context.auth,
			spaceId,
			title,
			status: status ?? 'current',
			representation: bodyFormat ?? 'storage',
			value: body ?? '',
			isPrivate,
		});
	},
});
