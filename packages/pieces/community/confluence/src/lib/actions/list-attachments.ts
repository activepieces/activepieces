import { createAction } from '@activepieces/pieces-framework';
import { confluenceAuth } from '../auth';
import { confluenceApi } from '../common/api';
import { confluenceProps } from '../common/props';
import { listAttachmentsOutputSchema } from '../output-schemas';

export const listAttachmentsAction = createAction({
	auth: confluenceAuth,
	name: 'list-attachments',
	outputSchema: listAttachmentsOutputSchema,
	classification: 'SEARCH',
	displayName: 'List Attachments',
	description: 'Lists all attachments on a page.',
	audience: 'human',
	aiMetadata: { description: 'Lists the attachments on a Confluence page, returning their metadata including IDs. Use to enumerate a page\'s files or to find an attachment ID to feed into Download Attachment. Requires the page ID. Read-only and idempotent.', idempotent: true },
	props: {
		spaceId: confluenceProps.spaceId({ required: true }),
		pageId: confluenceProps.pageId({ required: true }),
	},
	async run(context) {
		const { pageId } = context.propsValue;

		const results = await confluenceApi.listPageAttachments({ auth: context.auth, pageId });

		return { results };
	},
});
