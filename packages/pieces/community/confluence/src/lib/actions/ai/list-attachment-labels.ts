import { createAction } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceListAttachmentLabelsOutputSchema } from '../../output-schemas';

export const listAttachmentLabelsAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_list_attachment_labels',
	outputSchema: confluenceListAttachmentLabelsOutputSchema,
	displayName: 'List Attachment Labels',
	description: 'Lists the labels on an attachment.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the labels on a Confluence attachment. Pass nextCursor back as Cursor for the next page.',
		idempotent: true,
	},
	props: {
		attachmentId: confluenceAiProps.attachmentId({ required: true }),
		limit: confluenceAiProps.limit({ required: false }),
		cursor: confluenceAiProps.cursor({ required: false }),
	},
	async run(context) {
		const { attachmentId, limit, cursor } = context.propsValue;
		return await confluenceApi.listContentChildren({
			auth: context.auth,
			contentType: 'attachments',
			contentId: attachmentId,
			relation: 'labels',
			query: { limit, cursor },
		});
	},
});
