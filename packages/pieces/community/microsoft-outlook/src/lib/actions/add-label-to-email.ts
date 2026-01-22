import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@microsoft/microsoft-graph-client';
import { microsoftOutlookAuth } from '../common/auth';
import { messageIdDropdown } from '../common/props';

export const addLabelToEmailAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'addLabelToEmail',
	displayName: 'Add Label to Email',
	description: 'Adds a category (label) to an email message.',
	props: {
		messageId: messageIdDropdown({
			displayName: 'Email',
			description: 'Select the email message to add the label to.',
			required: true,
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
		
		return response;
	},
});
