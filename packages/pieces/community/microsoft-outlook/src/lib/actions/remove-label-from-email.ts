import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import { Message } from '@microsoft/microsoft-graph-types';
import { microsoftOutlookAuth } from '../common/auth';

export const removeLabelFromEmailAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'removeLabelFromEmail',
	displayName: 'Remove Label from Email',
	description: 'Removes a category (label) from an email message.',
	props: {
		messageId: Property.Dropdown({
			displayName: 'Email',
			description: 'Select the email message to remove the label from.',
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
						.api('/me/messages?$top=50&$select=id,subject,from,receivedDateTime')
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
		categories: Property.Array({
			displayName: 'Categories to Remove',
			description: 'Categories to remove from the email.',
			required: true,
		}),
	},
	async run(context) {
		const { messageId, categories } = context.propsValue;

		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(context.auth.access_token),
			},
		});

		const message = await client.api(`/me/messages/${messageId}`).get();
		const existingCategories = message.categories || [];

		const updatedCategories = existingCategories.filter(
			(category: string) => !categories.includes(category)
		);

		const response = await client.api(`/me/messages/${messageId}`).patch({
			categories: updatedCategories,
		});

		return {
			success: true,
			message: 'Categories removed successfully.',
			messageId: response.id,
			categories: response.categories,
		};
	},
});
