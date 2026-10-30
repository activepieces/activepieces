import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceListPageAttachmentsOutputSchema } from '../../output-schemas';

export const listPageAttachmentsAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_list_page_attachments',
	outputSchema: confluenceListPageAttachmentsOutputSchema,
	displayName: 'List Page Attachments',
	description: 'Lists the attachments of a page.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the attachments of a Confluence page, optionally filtered by filename or media type. Use the attachment ID with Get Attachment, Download Attachment or Delete Attachment. Pass nextCursor back as Cursor for the next page.',
		idempotent: true,
	},
	props: {
		pageId: confluenceAiProps.pageId({ required: true }),
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
		const { pageId, filename, mediaType, sort, limit, cursor } = context.propsValue;
		return await confluenceApi.listContentChildren({
			auth: context.auth,
			contentType: 'pages',
			contentId: pageId,
			relation: 'attachments',
			query: { filename, mediaType, sort, limit, cursor },
		});
	},
});
