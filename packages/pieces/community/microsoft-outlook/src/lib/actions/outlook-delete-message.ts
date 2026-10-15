import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoftOutlookAuth } from '../common/auth';
import { outlookAtomicCommon } from '../common/atomic-common';
import { outlookCommon } from '../common/client';
import { outlookDeleteMessageActionOutputSchema } from '../output-schemas';

export const outlookDeleteMessageAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'outlook_delete_message',
	classification: 'DESTRUCTIVE',
	displayName: 'Delete Message (to Deleted Items)',
	description: 'Moves a message to the Deleted Items folder.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Deletes one message by moving it to Deleted Items, where it stays recoverable. This is the safe delete to prefer; Permanently Delete Message is unrecoverable. Not idempotent: repeating the call with the same ID fails once the message has moved.',
		idempotent: false,
	},
	props: {
		messageId: Property.ShortText({
			displayName: 'Message ID',
			description: outlookAtomicCommon.messageIdHint,
			required: true,
		}),
	},
	outputSchema: outlookDeleteMessageActionOutputSchema,
	async run(context) {
		const { messageId } = context.propsValue;

		const client = outlookCommon.createClient(context.auth);
		const prefix = outlookCommon.mailboxPrefix(context.auth);

		try {
			await client
				.api(`${prefix}/messages/${outlookAtomicCommon.encodeGraphId(messageId)}`)
				.delete();

			return {
				success: true,
				message: 'Message moved to Deleted Items.',
				messageId,
			};
		} catch (error) {
			throw outlookAtomicCommon.graphError({ error, operation: 'Deleting the Outlook message' });
		}
	},
});
