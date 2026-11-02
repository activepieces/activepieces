import { createAction, Property } from '@activepieces/pieces-framework';
import { ResponseType } from '@microsoft/microsoft-graph-client';
import { microsoftOutlookAuth } from '../common/auth';
import { outlookAtomicCommon } from '../common/atomic-common';
import { outlookCommon } from '../common/client';
import { outlookDownloadMessageAttachmentActionOutputSchema } from '../output-schemas';

export const outlookDownloadMessageAttachmentAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'outlook_download_message_attachment',
	classification: 'READ',
	displayName: 'Download Message Attachment',
	description: 'Downloads one file attachment of a message.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Downloads the bytes of a single file attachment and stores it for downstream steps. Only file attachments can be downloaded; item attachments (an attached email or event) and reference attachments (a cloud link) are rejected with an explanatory error, so check the attachment kind with List Message Attachments first. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		messageId: Property.ShortText({
			displayName: 'Message ID',
			description: outlookAtomicCommon.messageIdHint,
			required: true,
		}),
		attachmentId: Property.ShortText({
			displayName: 'Attachment ID',
			description:
				'Attachment ID from List Message Attachments. Attachment IDs are only valid inside their own message.',
			required: true,
		}),
	},
	outputSchema: outlookDownloadMessageAttachmentActionOutputSchema,
	async run(context) {
		const { messageId, attachmentId } = context.propsValue;

		const client = outlookCommon.createClient(context.auth);
		const prefix = outlookCommon.mailboxPrefix(context.auth);
		const attachmentPath = `${prefix}/messages/${outlookAtomicCommon.encodeGraphId(
			messageId,
		)}/attachments/${outlookAtomicCommon.encodeGraphId(attachmentId)}`;

		let metadata: Record<string, unknown>;
		try {
			metadata = await client
				.api(`${attachmentPath}?$select=${outlookAtomicCommon.attachmentSelect}`)
				.get();
		} catch (error) {
			throw outlookAtomicCommon.graphError({
				error,
				operation: 'Reading the Outlook attachment before download',
			});
		}

		const attachmentType = (metadata?.['@odata.type'] ?? '') as string;

		if (attachmentType !== '#microsoft.graph.fileAttachment') {
			throw new Error(
				`Downloading the Outlook attachment failed: this attachment is a ${
					attachmentType || 'non-file attachment'
				}, and only #microsoft.graph.fileAttachment items expose downloadable bytes. Use List Message Attachments to find a file attachment on this message.`,
			);
		}

		try {
			const bytes = await client
				.api(`${attachmentPath}/$value`)
				.responseType(ResponseType.ARRAYBUFFER)
				.get();

			const buffer = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
			const fileName = (metadata?.['name'] as string | undefined) ?? 'attachment';

			const file = await context.files.write({
				fileName,
				data: buffer,
			});

			return {
				messageId,
				attachmentId,
				fileName,
				contentType: metadata?.['contentType'] ?? null,
				size: buffer.length,
				file,
			};
		} catch (error) {
			throw outlookAtomicCommon.graphError({
				error,
				operation: 'Downloading the Outlook message attachment',
			});
		}
	},
});
