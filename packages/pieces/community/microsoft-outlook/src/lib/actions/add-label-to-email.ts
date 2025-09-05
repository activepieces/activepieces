import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@microsoft/microsoft-graph-client';
import { Message } from '@microsoft/microsoft-graph-types';
import { microsoftOutlookAuth } from '../common/auth';

export const addLabelToEmailAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'add-label-to-email',
	displayName: 'Add Label to Email',
	description: 'Add categories/labels to an email message in Microsoft Outlook.',
	props: {
		messageId: Property.ShortText({
			displayName: 'Message ID',
			description: 'The ID of the email message to add categories to. You can get this from email triggers or search actions.',
			required: true,
		}),
		categories: Property.Array({
			displayName: 'Categories/Labels',
			description: 'List of category names to add to the email (e.g., "Important", "Follow up", "Personal"). Existing categories will be preserved.',
			required: true,
		}),
	},
	async run(context) {
		const { messageId } = context.propsValue;
		const categories = context.propsValue.categories as string[];

		if (!messageId || messageId.trim() === '') {
			throw new Error('Message ID is required and cannot be empty.');
		}

		if (!categories || categories.length === 0) {
			throw new Error('At least one category must be specified.');
		}

		const validCategories = categories.filter(cat => cat && cat.trim() !== '');
		if (validCategories.length === 0) {
			throw new Error('All category names are empty. Please provide valid category names.');
		}

		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(context.auth.access_token),
			},
		});

		try {
			const currentMessage: Message = await client.api(`/me/messages/${messageId}`)
				.select('id,categories,subject')
				.get();

			if (!currentMessage) {
				throw new Error(`Message with ID '${messageId}' not found.`);
			}

			const existingCategories = currentMessage.categories || [];

			const allCategories = [...new Set([...existingCategories, ...validCategories])];

			const response: Message = await client.api(`/me/messages/${messageId}`).patch({
				categories: allCategories,
			});

			return {
				success: true,
				message: `Successfully added ${validCategories.length} category(ies) to email.`,
				messageId: messageId,
				messageSubject: currentMessage.subject,
				addedCategories: validCategories,
				existingCategories: existingCategories,
				allCategories: allCategories,
				totalCategories: allCategories.length,
				data: response,
			};
		} catch (error: any) {
			console.error('Add Label to Email Error:', error);
			
			if (error.status === 404) {
				throw new Error(`Email message with ID '${messageId}' not found. Please verify the message ID is correct.`);
			} else if (error.status === 403) {
				throw new Error('Access denied. Please ensure you have the necessary permissions to modify this email.');
			} else if (error.status === 401) {
				throw new Error('Authentication failed. Please check your Microsoft Outlook connection.');
			} else if (error.status === 429) {
				throw new Error('Rate limit exceeded. Please wait a moment and try again.');
			}

			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			throw new Error(`Failed to add categories to email: ${errorMessage}`);
		}
	},
});
