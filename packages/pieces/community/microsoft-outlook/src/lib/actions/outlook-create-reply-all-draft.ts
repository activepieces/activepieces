import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoftOutlookAuth } from '../common/auth';
import { outlookAtomicCommon } from '../common/atomic-common';
import { outlookCommon } from '../common/client';
import { outlookMessageActionOutputSchema } from '../output-schemas';

export const outlookCreateReplyAllDraftAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'outlook_create_reply_all_draft',
	classification: 'WRITE',
	displayName: 'Create Reply-All Draft',
	description: 'Creates an unsent reply-all draft for a message.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Creates an unsent draft addressed to the sender and every other recipient of an existing message, and returns the draft message ID. Use Create Reply Draft to answer only the sender, or Reply All to Message to send immediately. Send it later with Send Draft. Not idempotent: each call creates another draft.',
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
	outputSchema: outlookMessageActionOutputSchema,
	async run(context) {
		const { messageId, comment } = context.propsValue;

		const client = outlookCommon.createClient(context.auth);
		const prefix = outlookCommon.mailboxPrefix(context.auth);

		try {
			return await client
				.api(`${prefix}/messages/${outlookAtomicCommon.encodeGraphId(messageId)}/createReplyAll`)
				.post({ comment: comment ?? '' });
		} catch (error) {
			throw outlookAtomicCommon.graphError({
				error,
				operation: 'Creating the Outlook reply-all draft',
			});
		}
	},
});
