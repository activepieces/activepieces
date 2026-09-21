import { createAction, Property } from '@activepieces/pieces-framework';
import { Message } from '@microsoft/microsoft-graph-types';
import { microsoftOutlookAuth } from '../common/auth';
import { outlookAtomicCommon } from '../common/atomic-common';
import { outlookCommon } from '../common/client';
import { outlookMoveMessageActionOutputSchema } from '../output-schemas';

export const outlookMoveMessageAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'outlook_move_message',
	classification: 'WRITE',
	displayName: 'Move Message',
	description: 'Moves a message to another mail folder.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Moves one message into another mail folder and returns the moved copy. The move mints a NEW message ID: the original ID stops resolving, so use the returned newMessageId for any follow-up step. Use Copy Message to leave the original in place, or Batch Move Messages for many messages. Not idempotent: a retry with the old ID fails.',
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
	outputSchema: outlookMoveMessageActionOutputSchema,
	async run(context) {
		const { messageId, destinationFolderId } = context.propsValue;

		const client = outlookCommon.createClient(context.auth);
		const prefix = outlookCommon.mailboxPrefix(context.auth);

		try {
			const moved: Message = await client
				.api(`${prefix}/messages/${outlookAtomicCommon.encodeGraphId(messageId)}/move`)
				.post({ destinationId: destinationFolderId });

			return {
				success: true,
				previousMessageId: messageId,
				newMessageId: moved?.id ?? null,
				destinationFolderId,
				message: moved,
			};
		} catch (error) {
			throw outlookAtomicCommon.graphError({ error, operation: 'Moving the Outlook message' });
		}
	},
});
