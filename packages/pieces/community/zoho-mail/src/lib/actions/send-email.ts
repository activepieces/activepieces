import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import FormData from 'form-data';
import { zohoMailApiCall } from '../common';
import { zohoMailAuth } from '../common/auth';
import { accountId, fromAddress } from '../common/props';

export const sendEmailAction = createAction({
	auth: zohoMailAuth,
	name: 'send_email',
	displayName: 'Send Email',
	description: 'Sends an email.',
	props: {
		accountId: accountId({ displayName: 'Account', required: true }),
		fromAddress: fromAddress({ displayName: 'From Email Address', required: true }),
		toAddress: Property.ShortText({
			displayName: 'To Email Address',
			description: "Recipient's email address.",
			required: true,
		}),

		subject: Property.LongText({
			displayName: 'Subject',
			required: true,
		}),

		mailFormat: Property.StaticDropdown({
			displayName: 'Mail Format',
			required: true,
			options: {
				options: [
					{ label: 'HTML', value: 'html' },
					{ label: 'Plain Text', value: 'plaintext' },
				],
			},
			defaultValue: 'html',
		}),
		content: Property.LongText({
			displayName: 'Content',
			description: 'HTML or plain text content of the email.',
			required: true,
		}),
		ccAddress: Property.ShortText({
			displayName: 'CC Email Address',
			description: "CC recipient's email address.",
			required: false,
		}),
		bccAddress: Property.ShortText({
			displayName: 'BCC Email Address',
			description: "BCC recipient's email address.",
			required: false,
		}),
		askReceipt: Property.StaticDropdown({
			displayName: 'Ask for Read Receipt',
			required: false,
			options: {
				options: [
					{ label: 'Yes', value: 'yes' },
					{ label: 'No', value: 'no' },
				],
			},
		}),
		attachment: Property.File({
			displayName: 'Attachment',
			required: false,
		}),
		attachmentName: Property.ShortText({
			displayName: 'Attachment Name',
			description: 'In case you want to change the name of the attachment.',
			required: false,
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
