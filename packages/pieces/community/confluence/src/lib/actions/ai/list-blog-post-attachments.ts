import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceListBlogPostAttachmentsOutputSchema } from '../../output-schemas';

export const listBlogPostAttachmentsAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_list_blog_post_attachments',
	outputSchema: confluenceListBlogPostAttachmentsOutputSchema,
	displayName: 'List Blog Post Attachments',
	description: 'Lists the attachments of a blog post.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the attachments of a Confluence blog post, optionally filtered by filename or media type. Use the attachment ID with Get Attachment or Download Attachment. Pass nextCursor back as Cursor for the next page.',
		idempotent: true,
	},
	props: {
		blogPostId: confluenceAiProps.blogPostId({ required: true }),
		filename: Property.ShortText({
			displayName: 'Filename',
			description: 'Only attachments with this filename.',
			required: false,
		}),
		mediaType: Property.ShortText({
			displayName: 'Media Type',
			description: 'Only attachments of this media type, e.g. image/png.',
			required: false,
		}),
		limit: confluenceAiProps.limit({ required: false }),
		cursor: confluenceAiProps.cursor({ required: false }),
	},
	async run(context) {
		const { blogPostId, filename, mediaType, limit, cursor } = context.propsValue;
		return await confluenceApi.listContentChildren({
			auth: context.auth,
			contentType: 'blogposts',
			contentId: blogPostId,
			relation: 'attachments',
			query: { filename, mediaType, limit, cursor },
		});
	},
});
