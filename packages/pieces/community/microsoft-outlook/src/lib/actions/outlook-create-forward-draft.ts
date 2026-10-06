import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoftOutlookAuth } from '../common/auth';
import { outlookAtomicCommon } from '../common/atomic-common';
import { outlookCommon } from '../common/client';
import { outlookDraftMessageActionOutputSchema } from '../output-schemas';

export const outlookCreateForwardDraftAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'outlook_create_forward_draft',
	classification: 'WRITE',
	displayName: 'Create Forward Draft',
	description: 'Creates an unsent forward draft for a message.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Creates an unsent draft that forwards an existing message to the given recipients, and returns the draft message ID so the forward can be edited before sending. Use Forward Message to send in one step, and Send Draft to dispatch this draft. Not idempotent: each call creates another draft.',
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
			description: 'Email addresses the draft will forward the message to.',
			required: true,
		}),
		comment: Property.LongText({
			displayName: 'Comment',
			description: 'Optional text added above the forwarded message.',
			required: false,
		}),
	},
	outputSchema: outlookDraftMessageActionOutputSchema,
	async run(context) {
		const { messageId, comment } = context.propsValue;
		const recipients = context.propsValue.recipients as string[];

		const client = outlookCommon.createClient(context.auth);
		const prefix = outlookCommon.mailboxPrefix(context.auth);

		try {
			return await client
				.api(`${prefix}/messages/${outlookAtomicCommon.encodeGraphId(messageId)}/createForward`)
				.post({
					comment: comment ?? '',
					toRecipients: recipients.map((mail) => ({ emailAddress: { address: mail } })),
				});
		} catch (error) {
			throw outlookAtomicCommon.graphError({
				error,
				operation: 'Creating the Outlook forward draft',
			});
		}
	},
});
