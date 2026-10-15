import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoftOutlookAuth } from '../common/auth';
import { outlookAtomicCommon } from '../common/atomic-common';
import { outlookCommon } from '../common/client';
import { outlookDraftMessageActionOutputSchema } from '../output-schemas';

export const outlookCreateReplyDraftAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'outlook_create_reply_draft',
	classification: 'WRITE',
	displayName: 'Create Reply Draft',
	description: 'Creates an unsent reply draft for a message.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Creates an unsent draft reply to the sender of an existing message and returns the draft message ID. Use this when the reply needs editing, extra attachments or review before it goes out; use Reply to Message to send in one step, and Send Draft to dispatch the draft afterwards. Not idempotent: each call creates another draft.',
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
			description: 'Optional text added above the quoted original message.',
			required: false,
		}),
	},
	outputSchema: outlookDraftMessageActionOutputSchema,
	async run(context) {
		const { messageId, comment } = context.propsValue;

		const client = outlookCommon.createClient(context.auth);
		const prefix = outlookCommon.mailboxPrefix(context.auth);

		try {
			return await client
				.api(`${prefix}/messages/${outlookAtomicCommon.encodeGraphId(messageId)}/createReply`)
				.post({ comment: comment ?? '' });
		} catch (error) {
			throw outlookAtomicCommon.graphError({
				error,
				operation: 'Creating the Outlook reply draft',
			});
		}
	},
});
