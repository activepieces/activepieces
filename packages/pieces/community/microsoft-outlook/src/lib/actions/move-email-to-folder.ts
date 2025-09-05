import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@microsoft/microsoft-graph-client';
import { Message } from '@microsoft/microsoft-graph-types';
import { microsoftOutlookAuth } from '../common/auth';

export const moveEmailToFolderAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'move-email-to-folder',
	displayName: 'Move Email to Folder',
	description: 'Move an email message to a specified folder in Microsoft Outlook using Microsoft Graph API.',
	props: {
		messageId: Property.ShortText({
			displayName: 'Message ID',
			description: 'The ID of the email message to move. You can get this from email triggers or search actions.',
			required: true,
		}),
		folderId: Property.ShortText({
			displayName: 'Destination Folder ID',
			description: 'The ID or name of the destination folder. Use well-known names: "inbox", "sentitems", "drafts", "deleteditems", "junkemail", "outbox" or provide a specific folder ID.',
			required: true,
		}),
		createCopy: Property.Checkbox({
			displayName: 'Create Copy',
			description: 'If enabled, creates a copy of the email in the destination folder instead of moving it. The original email remains in its current location.',
			required: false,
			defaultValue: false,
		}),
	},
	async run(context) {
		const { messageId, folderId, createCopy } = context.propsValue;

		if (!messageId || messageId.trim() === '') {
			throw new Error('Message ID is required and cannot be empty.');
		}

		if (!folderId || folderId.trim() === '') {
			throw new Error('Destination folder ID is required and cannot be empty.');
		}

		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(context.auth.access_token),
			},
		});

		try {
			let destinationFolderId = folderId.trim();
			
			const wellKnownFolders = ['inbox', 'sentitems', 'drafts', 'deleteditems', 'junkemail', 'outbox'];
			if (wellKnownFolders.includes(destinationFolderId.toLowerCase())) {
				destinationFolderId = destinationFolderId.toLowerCase();
			}

			let response: Message;
			
			if (createCopy) {
				response = await client.api(`/me/messages/${messageId}/copy`).post({
					destinationId: destinationFolderId,
				});
			} else {
				response = await client.api(`/me/messages/${messageId}/move`).post({
					destinationId: destinationFolderId,
				});
			}

			return {
				success: true,
				message: createCopy ? 'Email copied to folder successfully.' : 'Email moved to folder successfully.',
				operation: createCopy ? 'copy' : 'move',
				originalMessageId: messageId,
				newMessageId: response.id,
				newSubject: response.subject,
				destinationFolderId: destinationFolderId,
				newParentFolderId: response.parentFolderId,
				operationDateTime: new Date().toISOString(),
				isDraft: response.isDraft,
				isRead: response.isRead,
				data: response,
			};
		} catch (error: any) {
			console.error('Move Email to Folder Error:', error);
			
			if (error.status === 400) {
				throw new Error('Invalid request. Please check the message ID and destination folder ID.');
			} else if (error.status === 401) {
				throw new Error('Authentication failed. Please check your Microsoft Outlook connection.');
			} else if (error.status === 403) {
				throw new Error('Access denied. Please ensure you have permission to move this email.');
			} else if (error.status === 404) {
				if (error.message && error.message.includes('folder')) {
					throw new Error(`Destination folder '${folderId}' not found. Please verify the folder ID or use a valid folder name.`);
				} else {
					throw new Error(`Email message with ID '${messageId}' not found. Please verify the message ID is correct.`);
				}
			} else if (error.status === 429) {
				throw new Error('Rate limit exceeded. Please wait a moment and try again.');
			}

			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			const operation = createCopy ? 'copy' : 'move';
			throw new Error(`Failed to ${operation} email to folder: ${errorMessage}`);
		}
	},
});
