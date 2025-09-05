import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import { Message } from '@microsoft/microsoft-graph-types';
import { microsoftOutlookAuth } from '../common/auth';

export const addLabelToEmailAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'addLabelToEmail',
	displayName: 'Add Label to Email',
	description: 'Adds a category (label) to an email message.',
	props: {
		messageId: Property.Dropdown({
			displayName: 'Email',
			description: 'Select the email message to add the label to.',
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
			displayName: 'Categories',
			description: 'Categories to add to the email.',
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

		const updatedCategories = [...new Set([...existingCategories, ...categories])];

		const response = await client.api(`/me/messages/${messageId}`).patch({
			categories: updatedCategories,
		});

		return {
			success: true,
			message: 'Categories added successfully.',
			messageId: response.id,
			categories: response.categories,
		};
	},
});
