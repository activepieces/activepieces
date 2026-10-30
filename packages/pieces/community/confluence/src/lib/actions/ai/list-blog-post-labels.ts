import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceListAttachmentLabelsOutputSchema } from '../../output-schemas';

export const listBlogPostLabelsAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_list_blog_post_labels',
	outputSchema: confluenceListAttachmentLabelsOutputSchema,
	displayName: 'List Blog Post Labels',
	description: 'Lists the labels on a blog post.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the labels on a Confluence blog post, optionally filtered by prefix. Pass nextCursor back as Cursor for the next page.',
		idempotent: true,
	},
	props: {
		blogPostId: confluenceAiProps.blogPostId({ required: true }),
		prefix: Property.StaticDropdown({
			displayName: 'Prefix',
			description: 'Only labels with this prefix.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Global', value: 'global' },
					{ label: 'My (personal)', value: 'my' },
					{ label: 'Team', value: 'team' },
					{ label: 'System', value: 'system' },
				],
			},
		}),
		limit: confluenceAiProps.limit({ required: false }),
		cursor: confluenceAiProps.cursor({ required: false }),
	},
	async run(context) {
		const { blogPostId, prefix, limit, cursor } = context.propsValue;
		return await confluenceApi.listContentChildren({
			auth: context.auth,
			contentType: 'blogposts',
			contentId: blogPostId,
			relation: 'labels',
			query: { prefix, limit, cursor },
		});
	},
});
