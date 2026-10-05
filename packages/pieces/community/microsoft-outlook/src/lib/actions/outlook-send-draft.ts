import { createAction, Property } from '@activepieces/pieces-framework';
import { microsoftOutlookAuth } from '../common/auth';
import { outlookAtomicCommon } from '../common/atomic-common';
import { outlookCommon } from '../common/client';
import { outlookSendDraftActionOutputSchema } from '../output-schemas';

export const outlookSendDraftAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'outlook_send_draft',
	classification: 'WRITE',
	displayName: 'Send Draft',
	description: 'Sends an existing draft message.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Sends a draft that already exists in the mailbox, identified by its message ID. Use this after Create Draft, Create Reply Draft, Create Reply-All Draft or Create Forward Draft. Not idempotent: the draft stops existing once sent, so a repeat call with the same ID fails.',
		idempotent: false,
	},
	props: {
		messageId: Property.ShortText({
			displayName: 'Draft Message ID',
			description:
				'ID of the draft to send. Obtain it from Create Draft or one of the Create ... Draft actions.',
			required: true,
		}),
	},
	outputSchema: outlookSendDraftActionOutputSchema,
	async run(context) {
		const { messageId } = context.propsValue;

		const client = outlookCommon.createClient(context.auth);
		const prefix = outlookCommon.mailboxPrefix(context.auth);

		try {
			await client
				.api(`${prefix}/messages/${outlookAtomicCommon.encodeGraphId(messageId)}/send`)
				.post({});

			return {
				success: true,
				message: 'Draft sent successfully.',
				messageId,
			};
		} catch (error) {
			throw outlookAtomicCommon.graphError({ error, operation: 'Sending the Outlook draft' });
		}
	},
});
