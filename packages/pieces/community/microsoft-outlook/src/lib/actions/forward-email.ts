import { ApFile, createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { Client, PageCollection } from '@microsoft/microsoft-graph-client';
import { BodyType, Message } from '@microsoft/microsoft-graph-types';
import { microsoftOutlookAuth } from '../common/auth';

export const forwardEmailAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'forwardEmail',
	displayName: 'Forward Email',
	description: 'Forwards an email message.',
	props: {
		messageId: Property.Dropdown({
			displayName: 'Email',
			description: 'Select the email message to forward.',
			required: true,
			refreshers: [],
			options: async ({ auth }) => {
				if (!auth) {
					return {
						disabled: true,
						options: [],
					};
				}

				const client = Client.initWithMiddleware({
					authProvider: {
						getAccessToken: () => Promise.resolve((auth as OAuth2PropertyValue).access_token),
					},
				});

				try {
					const response: PageCollection = await client
						.api('/me/messages?$top=50&$select=id,subject,from,receivedDateTime')
						.orderby('receivedDateTime desc')
						.get();

					const messages = response.value as Message[];

					return {
						disabled: false,
						options: messages.map((message) => ({
							label: `${message.subject || 'No Subject'} - ${message.from?.emailAddress?.name || message.from?.emailAddress?.address || 'Unknown Sender'}`,
							value: message.id || '',
						})),
					};
				} catch (error) {
					return {
						disabled: true,
						options: [],
					};
				}
			},
		}),
		recipients: Property.Array({
			displayName: 'To Email(s)',
			required: true,
		}),
		ccRecipients: Property.Array({
			displayName: 'CC Email(s)',
			required: false,
			defaultValue: [],
		}),
		bccRecipients: Property.Array({
			displayName: 'BCC Email(s)',
			required: false,
			defaultValue: [],
		}),
		comment: Property.LongText({
			displayName: 'Comment',
			description: 'Optional comment to include with the forwarded message.',
			required: false,
		}),
		bodyFormat: Property.StaticDropdown({
			displayName: 'Body Format',
			required: true,
			defaultValue: 'text',
			options: {
				disabled: false,
				options: [
					{ label: 'HTML', value: 'html' },
					{ label: 'Text', value: 'text' },
				],
			},
		}),
		attachments: Property.Array({
			displayName: 'Attachments',
			required: false,
			defaultValue: [],
			properties: {
				file: Property.File({
					displayName: 'File',
					required: true,
				}),
				fileName: Property.ShortText({
					displayName: 'File Name',
					required: false,
				}),
			},
		}),
	},
	async run(context) {
		const { messageId, comment, bodyFormat } = context.propsValue;
		const recipients = context.propsValue.recipients as string[];
		const ccRecipients = context.propsValue.ccRecipients as string[];
		const bccRecipients = context.propsValue.bccRecipients as string[];
		const attachments = context.propsValue.attachments as Array<{ file: ApFile; fileName: string }>;

		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(context.auth.access_token),
			},
		});

		const message: Message = {
			toRecipients: recipients.map((mail) => ({
				emailAddress: {
					address: mail,
				},
			})),
			ccRecipients: ccRecipients.map((mail) => ({
				emailAddress: {
					address: mail,
				},
			})),
			bccRecipients: bccRecipients.map((mail) => ({
				emailAddress: {
					address: mail,
				},
			})),
			attachments: attachments.map((attachment) => ({
				'@odata.type': '#microsoft.graph.fileAttachment',
				name: attachment.fileName || attachment.file.filename,
				contentBytes: attachment.file.base64,
			})),
		};

		if (comment) {
			message.body = {
				content: comment,
				contentType: bodyFormat as BodyType,
			};
		}

		const response = await client
			.api(`/me/messages/${messageId}/forward`)
			.post({
				message,
			});

		return {
			success: true,
			message: 'Email forwarded successfully.',
			messageId: response.id,
			...response,
		};
	},
});
