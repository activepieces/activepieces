import { ApFile, createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@microsoft/microsoft-graph-client';
import { BodyType, Message } from '@microsoft/microsoft-graph-types';
import { microsoftOutlookAuth } from '../common/auth';

export const forwardEmailAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'forward-email',
	displayName: 'Forward Email',
	description: 'Forward an email message to specified recipients using Microsoft Graph API.',
	props: {
		messageId: Property.ShortText({
			displayName: 'Message ID',
			description: 'The ID of the email message to forward. You can get this from email triggers or search actions.',
			required: true,
		}),
		recipients: Property.Array({
			displayName: 'To Email(s)',
			description: 'List of email addresses to forward the message to (e.g., ["user@example.com", "admin@company.com"])',
			required: true,
		}),
		ccRecipients: Property.Array({
			displayName: 'CC Email(s)',
			description: 'List of CC recipient email addresses',
			required: false,
			defaultValue: [],
		}),
		bccRecipients: Property.Array({
			displayName: 'BCC Email(s)',
			description: 'List of BCC recipient email addresses',
			required: false,
			defaultValue: [],
		}),
		comment: Property.LongText({
			displayName: 'Forward Comment',
			description: 'Optional comment to add when forwarding the email. This will appear above the original message.',
			required: false,
		}),
		bodyFormat: Property.StaticDropdown({
			displayName: 'Comment Format',
			description: 'Format of the forward comment',
			required: false,
			defaultValue: 'html',
			options: {
				disabled: false,
				options: [
					{ label: 'HTML', value: 'html' },
					{ label: 'Text', value: 'text' },
				],
			},
		}),
		attachments: Property.Array({
			displayName: 'Additional Attachments',
			description: 'Additional files to attach when forwarding (original attachments are included automatically)',
			required: false,
			defaultValue: [],
			properties: {
				file: Property.File({
					displayName: 'File',
					description: 'File to attach',
					required: true,
				}),
				fileName: Property.ShortText({
					displayName: 'File Name',
					description: 'Custom name for the attachment (optional)',
					required: false,
				}),
			},
		}),
		importance: Property.StaticDropdown({
			displayName: 'Importance',
			description: 'Set the importance level of the forwarded email',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Low', value: 'low' },
					{ label: 'Normal', value: 'normal' },
					{ label: 'High', value: 'high' },
				],
			},
		}),
		categories: Property.Array({
			displayName: 'Categories',
			description: 'Categories/labels to assign to the forwarded email (e.g., ["Important", "Follow up"])',
			required: false,
			defaultValue: [],
		}),
		draft: Property.Checkbox({
			displayName: 'Create Draft',
			description: 'If enabled, creates a draft without sending. If disabled, forwards the email immediately.',
			required: false,
			defaultValue: false,
		}),
	},
	async run(context) {
		const { messageId, comment, bodyFormat, importance, categories, draft } = context.propsValue;
		const recipients = context.propsValue.recipients as string[];
		const ccRecipients = context.propsValue.ccRecipients as string[];
		const bccRecipients = context.propsValue.bccRecipients as string[];
		const attachments = context.propsValue.attachments as Array<{
			file: ApFile;
			fileName: string;
		}>;

		if (!messageId || messageId.trim() === '') {
			throw new Error('Message ID is required and cannot be empty.');
		}

		if (!recipients || recipients.length === 0) {
			throw new Error('At least one recipient email address is required.');
		}

		const forwardPayload: any = {
			toRecipients: recipients.map((mail) => ({
				emailAddress: {
					address: mail.trim(),
				},
			})),
			ccRecipients: ccRecipients.map((mail) => ({
				emailAddress: {
					address: mail.trim(),
				},
			})),
			bccRecipients: bccRecipients.map((mail) => ({
				emailAddress: {
					address: mail.trim(),
				},
			})),
		};

		if (comment && comment.trim() !== '') {
			forwardPayload.message = {
				body: {
					content: comment,
					contentType: bodyFormat as BodyType,
				},
			};

			if (attachments && attachments.length > 0) {
				forwardPayload.message.attachments = attachments.map((attachment) => ({
					'@odata.type': '#microsoft.graph.fileAttachment',
					name: attachment.fileName || attachment.file.filename,
					contentBytes: attachment.file.base64,
				}));
			}
		} else if (attachments && attachments.length > 0) {
			forwardPayload.message = {
				attachments: attachments.map((attachment) => ({
					'@odata.type': '#microsoft.graph.fileAttachment',
					name: attachment.fileName || attachment.file.filename,
					contentBytes: attachment.file.base64,
				})),
			};
		}

		if (importance) {
			if (!forwardPayload.message) {
				forwardPayload.message = {};
			}
			forwardPayload.message.importance = importance;
		}

		if (categories && categories.length > 0) {
			if (!forwardPayload.message) {
				forwardPayload.message = {};
			}
			forwardPayload.message.categories = (categories as string[]).filter(cat => cat && cat.trim() !== '');
		}

		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(context.auth.access_token),
			},
		});

		try {
			const response: Message = await client
				.api(`/me/messages/${messageId}/createForward`)
				.post(forwardPayload);

			const draftId = response.id;

			if (!draft) {
				await client.api(`/me/messages/${draftId}/send`).post({});
				return {
					success: true,
					message: 'Email forwarded successfully.',
					originalMessageId: messageId,
					forwardedMessageId: draftId,
					recipientCount: {
						to: recipients.length,
						cc: ccRecipients.length,
						bcc: bccRecipients.length,
					},
					hasComment: !!(comment && comment.trim()),
					attachmentCount: attachments.length,
					importance: importance || null,
					categoriesCount: categories ? (categories as string[]).filter(cat => cat && cat.trim() !== '').length : 0,
					data: response,
				};
			}

			return {
				success: true,
				message: 'Forward draft created successfully.',
				originalMessageId: messageId,
				draftId: draftId,
				draftSubject: response.subject,
				createdDateTime: response.createdDateTime,
				draftLink: `https://outlook.office.com/mail/drafts/id/${draftId}`,
				recipientCount: {
					to: recipients.length,
					cc: ccRecipients.length,
					bcc: bccRecipients.length,
				},
				hasComment: !!(comment && comment.trim()),
				attachmentCount: attachments.length,
				importance: importance || null,
				categoriesCount: categories ? (categories as string[]).filter(cat => cat && cat.trim() !== '').length : 0,
				data: response,
			};
		} catch (error: any) {
			console.error('Forward Email Error:', error);
			
			if (error.status === 400) {
				throw new Error('Invalid request. Please check the message ID and recipient email addresses.');
			} else if (error.status === 401) {
				throw new Error('Authentication failed. Please check your Microsoft Outlook connection.');
			} else if (error.status === 403) {
				throw new Error('Access denied. Please ensure you have permission to forward this email.');
			} else if (error.status === 404) {
				throw new Error(`Email message with ID '${messageId}' not found. Please verify the message ID is correct.`);
			} else if (error.status === 413) {
				throw new Error('Request too large. Please reduce attachment sizes (max 4MB total).');
			} else if (error.status === 429) {
				throw new Error('Rate limit exceeded. Please wait a moment and try again.');
			}

			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			throw new Error(`Failed to forward email: ${errorMessage}`);
		}
	},
});
