import { createAction, Property } from '@activepieces/pieces-framework';
import { PageCollection } from '@microsoft/microsoft-graph-client';
import { microsoftOutlookAuth } from '../common/auth';
import { outlookAtomicCommon } from '../common/atomic-common';
import { outlookCommon } from '../common/client';
import { outlookListMessageAttachmentsActionOutputSchema } from '../output-schemas';

export const outlookListMessageAttachmentsAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'outlook_list_message_attachments',
	classification: 'SEARCH',
	displayName: 'List Message Attachments',
	description: 'Lists the attachments of a message without downloading them.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists every attachment on one message with its ID, name, content type, size and kind, without transferring any file bytes. Use this first to pick an attachment ID for Download Message Attachment or Get Message Attachment. Read-only and safe to retry.',
		idempotent: true,
	},
	props: {
		messageId: Property.ShortText({
			displayName: 'Message ID',
			description: outlookAtomicCommon.messageIdHint,
			required: true,
		}),
	},
	outputSchema: outlookListMessageAttachmentsActionOutputSchema,
	async run(context) {
		const { messageId } = context.propsValue;

		const client = outlookCommon.createClient(context.auth);
		const prefix = outlookCommon.mailboxPrefix(context.auth);

		try {
			const response: PageCollection = await client
				.api(
					`${prefix}/messages/${outlookAtomicCommon.encodeGraphId(
						messageId,
					)}/attachments?$select=${outlookAtomicCommon.attachmentSelect}`,
				)
				.get();

			const attachments = (response.value ?? []) as Array<Record<string, unknown>>;

			return {
				messageId,
				attachments: attachments.map((attachment) => ({
					id: attachment['id'] ?? null,
					name: attachment['name'] ?? null,
					contentType: attachment['contentType'] ?? null,
					size: attachment['size'] ?? null,
					isInline: attachment['isInline'] ?? null,
					lastModifiedDateTime: attachment['lastModifiedDateTime'] ?? null,
					attachmentType: attachment['@odata.type'] ?? null,
				})),
				count: attachments.length,
			};
		} catch (error) {
			throw outlookAtomicCommon.graphError({
				error,
				operation: 'Listing the Outlook message attachments',
			});
		}
	},
});
