import { createAction } from '@activepieces/pieces-framework';
import { Client } from '@microsoft/microsoft-graph-client';
import { microsoftOutlookAuth } from '../common/auth';
import { draftMessageIdDropdown } from '../common/props';

export const sendDraftEmailAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'sendDraftEmail',
	displayName: 'Send Draft Email',
	description: 'Sends a draft email message.',
	props: {
		messageId: draftMessageIdDropdown({
			displayName: 'Draft Email',
			description: 'Select the draft email message to send.',
			required: true,
		}),
	},
	async run(context) {
		const { messageId } = context.propsValue;

		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(context.auth.access_token),
			},
		});

		await client.api(`/me/messages/${messageId}/send`).post({});

		return {
			success: true,
			message: 'Draft sent successfully.',
			messageId: messageId,
		};
	},
});
