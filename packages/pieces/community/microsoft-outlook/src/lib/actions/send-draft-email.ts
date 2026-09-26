import { createAction } from '@activepieces/pieces-framework';
import { microsoftOutlookAuth } from '../common/auth';
import { outlookCommon } from '../common/client';
import { draftMessageIdDropdown } from '../common/props';
import { sendDraftEmailActionOutputSchema } from '../output-schemas';

export const sendDraftEmailAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'sendDraftEmail',
	classification: 'WRITE',
	displayName: 'Send Draft Email',
	description: 'Send an email that is waiting in your Drafts folder.',
	audience: 'both',
	aiMetadata: { description: 'Sends an existing draft email (identified by draft message ID) from the Outlook mailbox. Use this to dispatch a draft previously staged by Create Draft Email or a draft reply. Not idempotent: once sent the draft no longer exists, so re-running with the same ID will fail.', idempotent: false },
	outputSchema: sendDraftEmailActionOutputSchema,
	props: {
		messageId: draftMessageIdDropdown({
			displayName: 'Email',
			description: 'Pick a draft from your Drafts folder.',
			required: true,
		}),
	},
	async run(context) {
		const { messageId } = context.propsValue;

		const client = outlookCommon.createClient(context.auth);

		await client.api(`${outlookCommon.mailboxPrefix(context.auth)}/messages/${messageId}/send`).post({});

		return {
			success: true,
			message: 'Draft sent successfully.',
			messageId: messageId,
		};
	},
});
