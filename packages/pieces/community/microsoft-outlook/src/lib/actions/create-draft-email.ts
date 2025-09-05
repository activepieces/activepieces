import { ApFile, createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@microsoft/microsoft-graph-client';
import { BodyType, Message } from '@microsoft/microsoft-graph-types';
import { microsoftOutlookAuth } from '../common/auth';

export const createDraftEmailAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'create-draft-email',
	displayName: 'Create Draft Email',
	description: 'Create a draft email message in Microsoft Outlook that can be edited and sent later.',
	props: {
		recipients: Property.Array({
			displayName: 'To Email(s)',
			description: 'List of recipient email addresses (e.g., ["user@example.com", "admin@company.com"])',
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
		subject: Property.ShortText({
			displayName: 'Subject',
			description: 'Email subject line',
			required: true,
		}),
		importance: Property.StaticDropdown({
			displayName: 'Importance',
			description: 'Set the importance level of the email',
			required: false,
			defaultValue: 'normal',
			options: {
				disabled: false,
				options: [
					{ label: 'Low', value: 'low' },
					{ label: 'Normal', value: 'normal' },
					{ label: 'High', value: 'high' },
				],
			},
		}),
		bodyFormat: Property.StaticDropdown({
			displayName: 'Body Format',
			description: 'Format of the email body content',
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
		body: Property.LongText({
			displayName: 'Body',
			description: 'Email body content. Use HTML tags if format is set to HTML.',
			required: true,
		}),
		replyTo: Property.Array({
			displayName: 'Reply To',
			description: 'Email addresses to use when recipients reply to this message',
			required: false,
			defaultValue: [],
		}),
		categories: Property.Array({
			displayName: 'Categories',
			description: 'Categories/labels to assign to the email (e.g., ["Important", "Follow up"])',
			required: false,
			defaultValue: [],
		}),
		sensitivity: Property.StaticDropdown({
			displayName: 'Sensitivity',
			description: 'Privacy level of the email',
			required: false,
			defaultValue: 'normal',
			options: {
				disabled: false,
				options: [
					{ label: 'Normal', value: 'normal' },
					{ label: 'Personal', value: 'personal' },
					{ label: 'Private', value: 'private' },
					{ label: 'Confidential', value: 'confidential' },
				],
			},
		}),
		isDeliveryReceiptRequested: Property.Checkbox({
			displayName: 'Request Delivery Receipt',
			description: 'Request a delivery receipt when the email is delivered',
			required: false,
			defaultValue: false,
		}),
		isReadReceiptRequested: Property.Checkbox({
			displayName: 'Request Read Receipt',
			description: 'Request a read receipt when the email is opened',
			required: false,
			defaultValue: false,
		}),
		attachments: Property.Array({
			displayName: 'Attachments',
			description: 'Files to attach to the email',
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
	},
	async run(context) {
		const recipients = context.propsValue.recipients as string[];
		const ccRecipients = context.propsValue.ccRecipients as string[];
		const bccRecipients = context.propsValue.bccRecipients as string[];
		const replyTo = context.propsValue.replyTo as string[];
		const categories = context.propsValue.categories as string[];
		const attachments = context.propsValue.attachments as Array<{ file: ApFile; fileName: string }>;

		const { 
			subject, 
			body, 
			bodyFormat, 
			importance, 
			sensitivity,
			isDeliveryReceiptRequested,
			isReadReceiptRequested 
		} = context.propsValue;

		if (!recipients || recipients.length === 0) {
			throw new Error('At least one recipient email address is required.');
		}

		if (!subject || subject.trim() === '') {
			throw new Error('Email subject is required.');
		}

		if (!body || body.trim() === '') {
			throw new Error('Email body is required.');
		}

		const mailPayload: Message = {
			subject,
			body: {
				content: body,
				contentType: bodyFormat as BodyType,
			},
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
			attachments: attachments.map((attachment) => ({
				'@odata.type': '#microsoft.graph.fileAttachment',
				name: attachment.fileName || attachment.file.filename,
				contentBytes: attachment.file.base64,
			})),
		};

		if (importance && importance !== 'normal') {
			mailPayload.importance = importance as any;
		}

		if (sensitivity && sensitivity !== 'normal') {
			(mailPayload as any).sensitivity = sensitivity;
		}

		if (replyTo && replyTo.length > 0) {
			mailPayload.replyTo = replyTo.map((email) => ({
				emailAddress: {
					address: email.trim(),
				},
			}));
		}

		if (categories && categories.length > 0) {
			mailPayload.categories = categories.filter(cat => cat && cat.trim() !== '');
		}

		if (isDeliveryReceiptRequested) {
			mailPayload.isDeliveryReceiptRequested = isDeliveryReceiptRequested;
		}

		if (isReadReceiptRequested) {
			mailPayload.isReadReceiptRequested = isReadReceiptRequested;
		}

		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(context.auth.access_token),
			},
		});

		try {
			const response: Message = await client.api('/me/messages').post(mailPayload);

			return {
				success: true,
				message: 'Draft email created successfully.',
				draftId: response.id,
				subject: response.subject,
				isDraft: response.isDraft,
				createdDateTime: response.createdDateTime,
				importance: response.importance,
				sensitivity: (response as any).sensitivity,
				categories: response.categories,
				isDeliveryReceiptRequested: response.isDeliveryReceiptRequested,
				isReadReceiptRequested: response.isReadReceiptRequested,
				draftLink: `https://outlook.office.com/mail/drafts/id/${response.id}`,
				recipientCount: {
					to: recipients.length,
					cc: ccRecipients.length,
					bcc: bccRecipients.length,
					replyTo: replyTo.length,
				},
				attachmentCount: attachments.length,
				categoriesCount: categories.length,
				data: response,
			};
		} catch (error: any) {
			console.error('Create Draft Email Error:', error);
			
			if (error.status === 400) {
				throw new Error('Invalid request. Please check email addresses and content format.');
			} else if (error.status === 401) {
				throw new Error('Authentication failed. Please check your Microsoft Outlook connection.');
			} else if (error.status === 403) {
				throw new Error('Access denied. Please ensure you have permission to create draft emails.');
			} else if (error.status === 413) {
				throw new Error('Request too large. Please reduce attachment sizes (max 4MB total).');
			} else if (error.status === 429) {
				throw new Error('Rate limit exceeded. Please wait a moment and try again.');
			}

			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			throw new Error(`Failed to create draft email: ${errorMessage}`);
		}
	},
});
