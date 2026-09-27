import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoftOutlookAuth } from '../common/auth';
import { outlookAtomicCommon } from '../common/atomic-common';
import { outlookCommon } from '../common/client';
import { outlookForwardMessageActionOutputSchema } from '../output-schemas';

export const outlookForwardMessageAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'outlook_forward_message',
	classification: 'WRITE',
	displayName: 'Forward Message',
	description: 'Forwards a message to new recipients.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Forwards an existing message to new recipients, keeping the original body and attachments and prepending an optional comment. Use Create Forward Draft when the forward should be edited before sending. Not idempotent: each call sends another forwarded copy.',
		idempotent: false,
	},
	props: {
		messageId: Property.ShortText({
			displayName: 'Message ID',
			description: outlookAtomicCommon.messageIdHint,
			required: true,
		}),
		recipients: Property.Array({
			displayName: 'To Email(s)',
			description: 'Email addresses to forward the message to.',
			required: true,
		}),
		comment: Property.LongText({
			displayName: 'Comment',
			description: 'Optional text added above the forwarded message.',
			required: false,
		}),
	},
	outputSchema: outlookForwardMessageActionOutputSchema,
	async run(context) {
		const { messageId, comment } = context.propsValue;
		const recipients = context.propsValue.recipients as string[];

		const client = outlookCommon.createClient(context.auth);
		const prefix = outlookCommon.mailboxPrefix(context.auth);

		try {
			await client
				.api(`${prefix}/messages/${outlookAtomicCommon.encodeGraphId(messageId)}/forward`)
				.post({
					comment: comment ?? '',
					toRecipients: recipients.map((mail) => ({ emailAddress: { address: mail } })),
				});

			return {
				success: true,
				message: 'Message forwarded successfully.',
				messageId,
				recipients,
			};
		} catch (error) {
			throw outlookAtomicCommon.graphError({ error, operation: 'Forwarding the Outlook message' });
		}
	},
});
