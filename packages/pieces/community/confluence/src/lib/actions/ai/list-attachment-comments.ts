import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceListAttachmentCommentsOutputSchema } from '../../output-schemas';

export const listAttachmentCommentsAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_list_attachment_comments',
	outputSchema: confluenceListAttachmentCommentsOutputSchema,
	displayName: 'List Attachment Comments',
	description: 'Lists the comments on an attachment.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the footer comments on a Confluence attachment, with their bodies. Pass nextCursor back as Cursor for the next page.',
		idempotent: true,
	},
	props: {
		attachmentId: confluenceAiProps.attachmentId({ required: true }),
		bodyFormat: confluenceAiProps.readBodyFormat({ required: false }),
		sort: Property.StaticDropdown({
			displayName: 'Sort',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Newest first', value: '-created-date' },
					{ label: 'Oldest first', value: 'created-date' },
					{ label: 'Recently modified first', value: '-modified-date' },
				],
			},
		}),
		limit: confluenceAiProps.limit({ required: false }),
		cursor: confluenceAiProps.cursor({ required: false }),
	},
	async run(context) {
		const { attachmentId, bodyFormat, sort, limit, cursor } = context.propsValue;
		return await confluenceApi.listContentChildren({
			auth: context.auth,
			contentType: 'attachments',
			contentId: attachmentId,
			relation: 'footer-comments',
			query: { 'body-format': bodyFormat ?? 'storage', sort, limit, cursor },
		});
	},
});
