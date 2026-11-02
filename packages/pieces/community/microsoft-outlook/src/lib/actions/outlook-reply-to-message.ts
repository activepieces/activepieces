import { createAction, Property } from '@activepieces/pieces-framework';
import { Message } from '@microsoft/microsoft-graph-types';
import { microsoftOutlookAuth } from '../common/auth';
import { outlookAtomicCommon } from '../common/atomic-common';
import { outlookCommon } from '../common/client';
import { outlookReplyToMessageActionOutputSchema } from '../output-schemas';

export const outlookReplyToMessageAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'outlook_reply_to_message',
	classification: 'WRITE',
	displayName: 'Reply to Message',
	description: 'Replies to the sender of a message.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Sends a reply to the sender of an existing message, quoting the original thread. Use Reply All to Message to include every original recipient, or Create Reply Draft when the reply must be reviewed before sending. Not idempotent: each call sends another reply.',
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
		ccRecipients: Property.Array({
			displayName: 'Additional CC Email(s)',
			required: false,
		}),
	},
	outputSchema: outlookReplyToMessageActionOutputSchema,
	async run(context) {
		const { messageId, comment } = context.propsValue;
		const ccRecipients = (context.propsValue.ccRecipients ?? []) as string[];

		const client = outlookCommon.createClient(context.auth);
		const prefix = outlookCommon.mailboxPrefix(context.auth);

		const payload: { comment: string; message?: Message } = { comment };
		if (ccRecipients.length > 0) {
			payload.message = {
				ccRecipients: ccRecipients.map((mail) => ({ emailAddress: { address: mail } })),
			};
		}

		try {
			await client
				.api(`${prefix}/messages/${outlookAtomicCommon.encodeGraphId(messageId)}/reply`)
				.post(payload);

			return {
				success: true,
				message: 'Reply sent successfully.',
				messageId,
			};
		} catch (error) {
			throw outlookAtomicCommon.graphError({ error, operation: 'Replying to the Outlook message' });
		}
	},
});
