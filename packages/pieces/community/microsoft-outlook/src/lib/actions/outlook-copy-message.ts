import { createAction, Property } from '@activepieces/pieces-framework';
import { Message } from '@microsoft/microsoft-graph-types';
import { microsoftOutlookAuth } from '../common/auth';
import { outlookAtomicCommon } from '../common/atomic-common';
import { outlookCommon } from '../common/client';
import { outlookCopyMessageActionOutputSchema } from '../output-schemas';

export const outlookCopyMessageAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'outlook_copy_message',
	classification: 'WRITE',
	displayName: 'Copy Message',
	description: 'Copies a message into another mail folder.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Copies one message into another mail folder, leaving the original where it is, and returns the copy. The copy has a NEW message ID, returned as newMessageId. Use Move Message when the original should not stay behind. Not idempotent: each call creates one more copy.',
		idempotent: false,
	},
	props: {
		messageId: Property.ShortText({
			displayName: 'Message ID',
			description: outlookAtomicCommon.messageIdHint,
			required: true,
		}),
		destinationFolderId: Property.ShortText({
			displayName: 'Destination Folder ID',
			description: outlookAtomicCommon.wellKnownFolderHint,
			required: true,
		}),
	},
	outputSchema: outlookCopyMessageActionOutputSchema,
	async run(context) {
		const { messageId, destinationFolderId } = context.propsValue;

		const client = outlookCommon.createClient(context.auth);
		const prefix = outlookCommon.mailboxPrefix(context.auth);

		try {
			const copied: Message = await client
				.api(`${prefix}/messages/${outlookAtomicCommon.encodeGraphId(messageId)}/copy`)
				.post({ destinationId: destinationFolderId });

			return {
				success: true,
				sourceMessageId: messageId,
				newMessageId: copied?.id ?? null,
				destinationFolderId,
				message: copied,
			};
		} catch (error) {
			throw outlookAtomicCommon.graphError({ error, operation: 'Copying the Outlook message' });
		}
	},
});
