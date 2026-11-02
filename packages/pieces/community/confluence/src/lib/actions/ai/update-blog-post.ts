import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceUpdateBlogPostOutputSchema } from '../../output-schemas';

export const updateBlogPostAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_update_blog_post',
	outputSchema: confluenceUpdateBlogPostOutputSchema,
	displayName: 'Update Blog Post',
	description: 'Updates the title, body or status of a blog post.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Updates a Confluence blog post by ID, changing only the title, body or status you set; everything else is kept. It reads the current version and saves the next one, so a concurrent edit between the read and the save is overwritten.',
		idempotent: true,
	},
	props: {
		blogPostId: confluenceAiProps.blogPostId({ required: true }),
		title: Property.ShortText({
			displayName: 'Title',
			description: 'New title. Leave empty to keep the current one.',
			required: false,
		}),
		body: confluenceAiProps.body({
			required: false,
			description:
				'New body in the selected format; replaces the whole body. Leave empty to keep the current one.',
		}),
		bodyFormat: confluenceAiProps.bodyFormat({ required: false }),
		status: confluenceAiProps.contentStatus({
			required: false,
			description: 'Published (current) or draft. Leave empty to keep the current status.',
		}),
		versionMessage: Property.ShortText({
			displayName: 'Version Message',
			description: 'Optional note describing this change.',
			required: false,
		}),
	},
	async run(context) {
		const { blogPostId, title, body, bodyFormat, status, versionMessage } = context.propsValue;
		if (title === undefined && body === undefined && status === undefined) {
			throw new Error('Set at least one of Title, Body or Status.');
		}
		const current = await confluenceApi.getVersionedContent({
			auth: context.auth,
			contentType: 'blogposts',
			contentId: blogPostId,
		});
		return await confluenceApi.updateBlogPost({
			auth: context.auth,
			blogPostId,
			title: title ?? current.title,
			status: status ?? current.status,
			representation: body === undefined ? 'storage' : bodyFormat ?? 'storage',
			value: body ?? current.body?.storage?.value ?? '',
			versionNumber: current.version.number + 1,
			versionMessage,
		});
	},
});
