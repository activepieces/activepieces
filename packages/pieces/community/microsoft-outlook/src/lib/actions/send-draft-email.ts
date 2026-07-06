import { createAction } from '@activepieces/pieces-framework';
import { microsoftOutlookAuth } from '../common/auth';
import { outlookCommon } from '../common/client';
import { draftMessageIdDropdown } from '../common/props';

export const sendDraftEmailAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'sendDraftEmail',
	displayName: 'Send Draft Email',
	description: 'Sends a draft email message.',
	audience: 'both',
	aiMetadata: { description: 'Sends an existing draft email (identified by draft message ID) from the Outlook mailbox. Use this to dispatch a draft previously staged by Create Draft Email or a draft reply. Not idempotent: once sent the draft no longer exists, so re-running with the same ID will fail.', idempotent: false },
	props: {
		messageId: draftMessageIdDropdown({
			displayName: 'Draft Email',
			description: 'Select the draft email message to send.',
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
