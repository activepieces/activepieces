import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@microsoft/microsoft-graph-client';
import { microsoftOutlookAuth } from '../common/auth';
import { messageIdDropdown } from '../common/props';

export const removeLabelFromEmailAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'removeLabelFromEmail',
	displayName: 'Remove Label from Email',
	description: 'Removes a category (label) from an email message.',
	props: {
		messageId: messageIdDropdown({
			displayName: 'Email',
			description: 'Select the email message to remove the label from.',
			required: true,
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

		return response;
	},
});
