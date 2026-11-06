import { createAction, Property } from '@activepieces/pieces-framework';
import { confluenceAuth } from '../auth';
import { confluenceApi } from '../common/api';
import { downloadAttachmentOutputSchema } from '../output-schemas';

export const downloadAttachmentAction = createAction({
	auth: confluenceAuth,
	name: 'download-attachment',
	outputSchema: downloadAttachmentOutputSchema,
	classification: 'READ',
	displayName: 'Download Attachment',
	description: 'Downloads an attachment file by its ID and returns it as a file.',
	audience: 'both',
	aiMetadata: { description: 'Downloads a Confluence attachment by its attachment ID, resolving the download link from the attachment metadata and returning the binary as a file plus the attachment details. Use to retrieve the actual file contents of an attachment (use List Attachments first to discover IDs). Read-only and idempotent.', idempotent: true },
	props: {
		attachmentId: Property.ShortText({
			displayName: 'Attachment ID',
			description: 'ID of the attachment to download. Use "List Attachments" to look up IDs.',
			required: true,
		}),
	},
	async run(context) {
		const { attachmentId } = context.propsValue;

		const attachment = await confluenceApi.getAttachment({ auth: context.auth, attachmentId });

		const buffer = await confluenceApi.downloadAttachment({
			auth: context.auth,
			downloadLink: attachment.downloadLink,
		});

		const file = await context.files.write({
			fileName: attachment.title,
			data: Buffer.from(buffer),
		});

		return {
			file,
			attachment,
		};
	},
});
