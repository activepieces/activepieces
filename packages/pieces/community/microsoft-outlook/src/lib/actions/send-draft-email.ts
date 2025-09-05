import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import { Message } from '@microsoft/microsoft-graph-types';
import { microsoftOutlookAuth } from '../common/auth';

export const sendDraftEmailAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'sendDraftEmail',
	displayName: 'Send Draft Email',
	description: 'Sends a draft email message.',
	props: {
		messageId: Property.Dropdown({
			displayName: 'Draft Email',
			description: 'Select the draft email message to send.',
			required: true,
			refreshers: [],
			options: async ({ auth }) => {
				if (!auth) {
					return {
						disabled: true,
						options: [],
					};
				}

				const client = Client.initWithMiddleware({
					authProvider: {
						getAccessToken: () => Promise.resolve((auth as OAuth2PropertyValue).access_token),
					},
				});

				try {
					const response: PageCollection = await client
						.api('/me/mailFolders/drafts/messages?$top=50&$select=id,subject,from,receivedDateTime')
						.orderby('receivedDateTime desc')
						.get();

					const messages = response.value as Message[];

					return {
						disabled: false,
						options: messages.map((message) => ({
							label: `${message.subject || 'No Subject'} - ${message.from?.emailAddress?.name || message.from?.emailAddress?.address || 'Unknown Sender'}`,
							value: message.id || '',
						})),
					};
				} catch (error) {
					return {
						disabled: true,
						options: [],
					};
				}
			},
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
