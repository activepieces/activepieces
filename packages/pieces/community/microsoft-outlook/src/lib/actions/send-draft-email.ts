import { createAction } from '@activepieces/pieces-framework';
import { getGraphBaseUrl } from '../common/microsoft-cloud';
import { Client } from '@microsoft/microsoft-graph-client';
import { microsoftOutlookAuth } from '../common/auth';
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

		const cloud = context.auth.props?.['cloud'] as string | undefined;
		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(context.auth.access_token),
			},
			baseUrl: getGraphBaseUrl(cloud),
		});

		await client.api(`/me/messages/${messageId}/send`).post({});

		return {
			success: true,
			message: 'Draft sent successfully.',
			messageId: messageId,
		};
	},
});
