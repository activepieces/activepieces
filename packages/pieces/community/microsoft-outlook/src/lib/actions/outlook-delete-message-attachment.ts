import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoftOutlookAuth } from '../common/auth';
import { outlookAtomicCommon } from '../common/atomic-common';
import { outlookCommon } from '../common/client';
import { outlookDeleteMessageAttachmentActionOutputSchema } from '../output-schemas';

export const outlookDeleteMessageAttachmentAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'outlook_delete_message_attachment',
	classification: 'DESTRUCTIVE',
	displayName: 'Delete Message Attachment',
	description: 'Removes an attachment from a message.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Removes one attachment from a message, typically a draft, and it cannot be restored afterwards. Resolve the attachment ID with List Message Attachments first. Not idempotent: repeating the call with the same ID fails once the attachment is gone.',
		idempotent: false,
	},
	props: {
		messageId: Property.ShortText({
			displayName: 'Message ID',
			description: outlookAtomicCommon.messageIdHint,
			required: true,
		}),
		attachmentId: Property.ShortText({
			displayName: 'Attachment ID',
			description: 'Attachment ID from List Message Attachments.',
			required: true,
		}),
	},
	outputSchema: outlookDeleteMessageAttachmentActionOutputSchema,
	async run(context) {
		const { messageId, attachmentId } = context.propsValue;

		const client = outlookCommon.createClient(context.auth);
		const prefix = outlookCommon.mailboxPrefix(context.auth);

		try {
			await client
				.api(
					`${prefix}/messages/${outlookAtomicCommon.encodeGraphId(
						messageId,
					)}/attachments/${outlookAtomicCommon.encodeGraphId(attachmentId)}`,
				)
				.delete();

			return {
				success: true,
				message: 'Attachment deleted.',
				messageId,
				attachmentId,
			};
		} catch (error) {
			throw outlookAtomicCommon.graphError({
				error,
				operation: 'Deleting the Outlook message attachment',
			});
		}
	},
});
