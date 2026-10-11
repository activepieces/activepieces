import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoftOutlookAuth } from '../common/auth';
import { outlookAtomicCommon } from '../common/atomic-common';
import { outlookCommon } from '../common/client';
import { outlookReplyAllToMessageActionOutputSchema } from '../output-schemas';

export const outlookReplyAllToMessageAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'outlook_reply_all_to_message',
	classification: 'WRITE',
	displayName: 'Reply All to Message',
	description: 'Replies to the sender and all recipients of a message.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Sends a reply to the sender and every other recipient of an existing message. Use Reply to Message to answer the sender only, or Create Reply-All Draft when the reply must be reviewed first. Not idempotent: each call sends another reply to everyone on the thread.',
		idempotent: false,
	},
	props: {
		messageId: Property.ShortText({
			displayName: 'Message ID',
			description: outlookAtomicCommon.messageIdHint,
			required: true,
		}),
		comment: Property.LongText({
			displayName: 'Reply Text',
			description: 'Text added above the quoted original message.',
			required: true,
		}),
	},
	outputSchema: outlookReplyAllToMessageActionOutputSchema,
	async run(context) {
		const { messageId, comment } = context.propsValue;

		const client = outlookCommon.createClient(context.auth);
		const prefix = outlookCommon.mailboxPrefix(context.auth);

		try {
			await client
				.api(`${prefix}/messages/${outlookAtomicCommon.encodeGraphId(messageId)}/replyAll`)
				.post({ comment });

			return {
				success: true,
				message: 'Reply-all sent successfully.',
				messageId,
			};
		} catch (error) {
			throw outlookAtomicCommon.graphError({
				error,
				operation: 'Replying to all recipients of the Outlook message',
			});
		}
	},
});
