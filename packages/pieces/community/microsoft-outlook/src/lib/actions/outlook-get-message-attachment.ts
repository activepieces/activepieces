import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoftOutlookAuth } from '../common/auth';
import { outlookAtomicCommon } from '../common/atomic-common';
import { outlookCommon } from '../common/client';
import { outlookGetMessageAttachmentActionOutputSchema } from '../output-schemas';

export const outlookGetMessageAttachmentAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'outlook_get_message_attachment',
	classification: 'READ',
	displayName: 'Get Message Attachment',
	description: 'Reads the metadata of one attachment.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Returns the metadata of a single attachment (name, content type, size, inline flag and attachment kind) without transferring the file bytes. Use Download Message Attachment when the file content itself is needed, and List Message Attachments to discover attachment IDs. Read-only and safe to retry.',
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
	outputSchema: outlookGetMessageAttachmentActionOutputSchema,
	async run(context) {
		const { messageId, attachmentId } = context.propsValue;

		const client = outlookCommon.createClient(context.auth);
		const prefix = outlookCommon.mailboxPrefix(context.auth);

		try {
			const attachment = await client
				.api(
					`${prefix}/messages/${outlookAtomicCommon.encodeGraphId(
						messageId,
					)}/attachments/${outlookAtomicCommon.encodeGraphId(attachmentId)}?$select=${
						outlookAtomicCommon.attachmentSelect
					}`,
				)
				.get();

			return {
				messageId,
				id: attachment?.['id'] ?? null,
				name: attachment?.['name'] ?? null,
				contentType: attachment?.['contentType'] ?? null,
				size: attachment?.['size'] ?? null,
				isInline: attachment?.['isInline'] ?? null,
				lastModifiedDateTime: attachment?.['lastModifiedDateTime'] ?? null,
				attachmentType: attachment?.['@odata.type'] ?? null,
			};
		} catch (error) {
			throw outlookAtomicCommon.graphError({
				error,
				operation: 'Reading the Outlook message attachment',
			});
		}
	},
});
