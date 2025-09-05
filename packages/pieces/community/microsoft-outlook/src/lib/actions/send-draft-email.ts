import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@microsoft/microsoft-graph-client';
import { Message } from '@microsoft/microsoft-graph-types';
import { microsoftOutlookAuth } from '../common/auth';

export const sendDraftEmailAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'send-draft-email',
	displayName: 'Send Draft Email',
	description: 'Send an existing draft email message in Microsoft Outlook using Microsoft Graph API.',
	props: {
		draftId: Property.ShortText({
			displayName: 'Draft ID',
			description: 'The ID of the draft email message to send. You can get this from the "Create Draft Email" action or email triggers.',
			required: true,
		}),
	},
	async run(context) {
		const { draftId } = context.propsValue;

		if (!draftId || draftId.trim() === '') {
			throw new Error('Draft ID is required and cannot be empty.');
		}

		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(context.auth.access_token),
			},
		});

		try {
			const draftMessage: Message = await client.api(`/me/messages/${draftId}`)
				.select('id,subject,isDraft,sentDateTime,toRecipients,ccRecipients,bccRecipients')
				.get();

			if (!draftMessage) {
				throw new Error(`Draft message with ID '${draftId}' not found.`);
			}

			if (!draftMessage.isDraft) {
				throw new Error(`Message with ID '${draftId}' is not a draft. Only draft messages can be sent using this action.`);
			}

			if (draftMessage.sentDateTime) {
				throw new Error(`Draft message with ID '${draftId}' has already been sent.`);
			}

			await client.api(`/me/messages/${draftId}/send`).post({});

			const recipientCount = {
				to: draftMessage.toRecipients?.length || 0,
				cc: draftMessage.ccRecipients?.length || 0,
				bcc: draftMessage.bccRecipients?.length || 0,
			};

			return {
				success: true,
				message: 'Draft email sent successfully.',
				sentDraftId: draftId,
				subject: draftMessage.subject,
				sentDateTime: new Date().toISOString(),
				recipientCount: recipientCount,
				totalRecipients: recipientCount.to + recipientCount.cc + recipientCount.bcc,
				data: draftMessage,
			};
		} catch (error: any) {
			console.error('Send Draft Email Error:', error);
			
			if (error.status === 404) {
				throw new Error(`Draft message with ID '${draftId}' not found. Please verify the draft ID is correct.`);
			} else if (error.status === 403) {
				throw new Error('Access denied. Please ensure you have permission to send emails from this account.');
			} else if (error.status === 401) {
				throw new Error('Authentication failed. Please check your Microsoft Outlook connection.');
			} else if (error.status === 400) {
				throw new Error('Invalid request. The draft message may not be valid or may have already been sent.');
			} else if (error.status === 429) {
				throw new Error('Rate limit exceeded. Please wait a moment and try again.');
			}

			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			throw new Error(`Failed to send draft email: ${errorMessage}`);
		}
	},
});