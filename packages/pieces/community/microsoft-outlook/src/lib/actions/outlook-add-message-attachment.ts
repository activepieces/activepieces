import { ApFile, createAction, Property } from '@activepieces/pieces-framework';
import { microsoftOutlookAuth } from '../common/auth';
import { outlookAtomicCommon } from '../common/atomic-common';
import { outlookCommon } from '../common/client';
import { outlookAddMessageAttachmentActionOutputSchema } from '../output-schemas';

export const outlookAddMessageAttachmentAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'outlook_add_message_attachment',
	classification: 'WRITE',
	displayName: 'Add Attachment to Draft',
	description: 'Attaches a file to a draft message.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Attaches one file to an existing draft message and returns the created attachment. Only meaningful on drafts, and only for files under 3 MB; larger files need an upload session, which this piece does not expose yet. Pair it with Create Draft and Send Draft. Not idempotent: each call adds another attachment, even with the same file name.',
		idempotent: false,
	},
	props: {
		messageId: Property.ShortText({
			displayName: 'Draft Message ID',
			description: 'ID of the draft to attach the file to. Obtain it from Create Draft.',
			required: true,
		}),
		file: Property.File({
			displayName: 'File',
			description: 'File to attach. Must be smaller than 3 MB.',
			required: true,
		}),
		fileName: Property.ShortText({
			displayName: 'File Name',
			description: 'Name shown on the attachment. Defaults to the uploaded file name.',
			required: false,
		}),
	},
	outputSchema: outlookAddMessageAttachmentActionOutputSchema,
	async run(context) {
		const { messageId, fileName } = context.propsValue;
		const file = context.propsValue.file as ApFile;

		const client = outlookCommon.createClient(context.auth);
		const prefix = outlookCommon.mailboxPrefix(context.auth);

		try {
			return await client
				.api(
					`${prefix}/messages/${outlookAtomicCommon.encodeGraphId(messageId)}/attachments`,
				)
				.post({
					'@odata.type': '#microsoft.graph.fileAttachment',
					name: fileName || file.filename,
					contentBytes: file.base64,
				});
		} catch (error) {
			throw outlookAtomicCommon.graphError({
				error,
				operation: 'Adding the attachment to the Outlook draft',
			});
		}
	},
});
