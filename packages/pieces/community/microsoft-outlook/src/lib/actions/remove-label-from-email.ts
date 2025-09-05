import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@microsoft/microsoft-graph-client';
import { Message } from '@microsoft/microsoft-graph-types';
import { microsoftOutlookAuth } from '../common/auth';

export const removeLabelFromEmailAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'remove-label-from-email',
	displayName: 'Remove Label from Email',
	description: 'Remove categories/labels from an email message in Microsoft Outlook using Microsoft Graph API.',
	props: {
		messageId: Property.ShortText({
			displayName: 'Message ID',
			description: 'The ID of the email message to remove categories from. You can get this from email triggers or search actions.',
			required: true,
		}),
		categories: Property.Array({
			displayName: 'Categories/Labels to Remove',
			description: 'List of category names to remove from the email (e.g., ["Important", "Follow up"]). Only existing categories will be removed. Not required if "Remove All Categories" is enabled.',
			required: false,
		}),
		removeAll: Property.Checkbox({
			displayName: 'Remove All Categories',
			description: 'If enabled, removes all categories from the email. When this is enabled, the specific categories list is ignored.',
			required: false,
			defaultValue: false,
		}),
	},
	async run(context) {
		const { messageId, removeAll } = context.propsValue;
		const categoriesToRemove = context.propsValue.categories as string[];

		if (!messageId || messageId.trim() === '') {
			throw new Error('Message ID is required and cannot be empty.');
		}

		if (!removeAll && (!categoriesToRemove || categoriesToRemove.length === 0)) {
			throw new Error('At least one category must be specified when not removing all categories.');
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

			let updatedCategories: string[];
			let actuallyRemoved: string[] = [];

			if (removeAll) {
				updatedCategories = [];
				actuallyRemoved = [...existingCategories];
			} else {
				const validCategoriesToRemove = categoriesToRemove.filter(cat => cat && cat.trim() !== '');
				updatedCategories = existingCategories.filter(
					(category: string) => !validCategoriesToRemove.includes(category)
				);
				actuallyRemoved = existingCategories.filter(
					(category: string) => validCategoriesToRemove.includes(category)
				);
			}

			const response: Message = await client.api(`/me/messages/${messageId}`).patch({
				categories: updatedCategories,
			});

			return {
				success: true,
				message: actuallyRemoved.length > 0 
					? `Successfully removed ${actuallyRemoved.length} category(ies) from email.`
					: 'No categories were removed (categories not found on email).',
				messageId: messageId,
				messageSubject: currentMessage.subject,
				removedCategories: actuallyRemoved,
				remainingCategories: updatedCategories,
				totalCategoriesRemoved: actuallyRemoved.length,
				totalCategoriesRemaining: updatedCategories.length,
				removeAllMode: removeAll,
				data: response,
			};
		} catch (error: any) {
			console.error('Remove Label from Email Error:', error);
			
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
			throw new Error(`Failed to remove categories from email: ${errorMessage}`);
		}
	},
});
