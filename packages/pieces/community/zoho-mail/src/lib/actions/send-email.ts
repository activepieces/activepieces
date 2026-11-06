import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import FormData from 'form-data';
import { zohoMailApiCall } from '../common';
import { zohoMailAuth } from '../common/auth';
import { accountId, fromAddress } from '../common/props';

export const sendEmailAction = createAction({
	auth: zohoMailAuth,
	name: 'send_email',
	classification: 'WRITE',
	displayName: 'Send Email',
	description: 'Sends an email.',
	audience: 'both',
	aiMetadata: {
		description:
			'Sends a new email from a Zoho Mail account to one recipient, with optional CC/BCC, read receipt, and a single file attachment; body is sent as HTML or plain text per the chosen format. Use to dispatch outbound mail. Not idempotent: each call sends a separate message.',
		idempotent: false,
	},
	propertyGroups: [
		{ key: 'sender', display: 'section', label: 'Sender', icon: 'user', props: ['accountId', 'fromAddress'] },
		{
			key: 'recipients',
			display: 'section',
			label: 'Send to',
			icon: 'send',
			props: ['toAddress', 'ccAddress', 'bccAddress'],
		},
		{
			key: 'message',
			display: 'section',
			label: 'Message',
			icon: 'text',
			props: ['subject', 'mailFormat', 'content'],
		},
		{
			key: 'attachment',
			display: 'section',
			label: 'Attachment',
			icon: 'paperclip',
			props: ['attachment', 'attachmentName'],
		},
	],
	props: {
		accountId: accountId({ displayName: 'Account', required: true }),
		fromAddress: fromAddress({ displayName: 'From', required: true }),
		toAddress: Property.ShortText({
			displayName: 'To',
			placeholder: 'recipient@example.com',
			required: true,
		}),
		ccAddress: Property.ShortText({
			displayName: 'Cc',
			placeholder: 'cc@example.com',
			width: 'half',
			required: false,
		}),
		bccAddress: Property.ShortText({
			displayName: 'Bcc',
			placeholder: 'bcc@example.com',
			width: 'half',
			required: false,
		}),
		subject: Property.LongText({
			displayName: 'Subject',
			placeholder: 'Invoice for March',
			required: true,
		}),
		mailFormat: Property.StaticDropdown({
			displayName: 'Body Format',
			description: 'How the text in Body is interpreted.',
			required: true,
			display: 'cards',
			options: {
				options: [
					{ label: 'HTML', value: 'html', description: 'Formatted', icon: 'code' },
					{ label: 'Plain Text', value: 'plaintext', description: 'Sent as written', icon: 'text' },
				],
			},
			defaultValue: 'html',
		}),
		content: Property.LongText({
			displayName: 'Body',
			description: 'Write HTML markup when Body Format is HTML.',
			required: true,
		}),
		attachment: Property.File({
			displayName: 'File',
			width: 'half',
			required: false,
		}),
		attachmentName: Property.ShortText({
			displayName: 'File Name',
			description: 'Overrides the uploaded file name.',
			placeholder: 'report.pdf',
			width: 'half',
			required: false,
		}),
		askReceipt: Property.StaticDropdown({
			displayName: 'Read Receipt',
			description: 'Ask recipients to confirm they opened the email.',
			required: false,
			advanced: true,
			options: {
				options: [
					{ label: 'Yes', value: 'yes' },
					{ label: 'No', value: 'no' },
				],
			},
		}),
	},
	async run(context) {
		const {
			accountId,
			fromAddress,
			toAddress,
			ccAddress,
			bccAddress,
			subject,
			content,
			mailFormat,
			askReceipt,
			attachment,
			attachmentName,
		} = context.propsValue;

		const requestBody: Record<string, unknown> = {
			fromAddress,
			toAddress,
			subject,
			content,
			mailFormat: mailFormat ?? 'html',
		};

		if (ccAddress) requestBody['ccAddress'] = ccAddress;
		if (bccAddress) requestBody['bccAddress'] = bccAddress;
		if (askReceipt) requestBody['askReceipt'] = askReceipt;

		if (attachment) {
			const formData = new FormData();

			formData.append(
				'attach',
				Buffer.from(attachment.base64, 'base64'),
				attachmentName || attachment.filename,
			);

			const location = context.auth.props?.['location'] ?? 'zoho.com';
			const baseUrl = `https://mail.${location}/api`;

			const uploadResponse = await httpClient.sendRequest<{
				data: { storeName: string; attachmentName: string; attachmentPath: string }[];
			}>({
				url: baseUrl + `/accounts/${accountId}/messages/attachments?uploadType=multipart`,
				method: HttpMethod.POST,
				body: formData,
				headers: {
					...formData.getHeaders(),
					Authorization: `Zoho-oauthtoken ${context.auth.access_token}`,
				},
			});

			requestBody['attachments'] = uploadResponse.body.data;
		}

		const response = await zohoMailApiCall({
			auth: context.auth,
			method: HttpMethod.POST,
			resourceUri: `/accounts/${accountId}/messages`,
			body: requestBody,
		});

		return response;
	},
});
