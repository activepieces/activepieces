import { ApFile, createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@microsoft/microsoft-graph-client';
import { BodyType, Message } from '@microsoft/microsoft-graph-types';
import { microsoftOutlookAuth } from '../common/auth';

export const createDraftEmailAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'createDraftEmail',
	displayName: 'Create Draft Email',
	description: 'Creates a draft email message.',
	props: {
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
		subject: Property.ShortText({
			displayName: 'Subject',
			required: true,
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
		body: Property.LongText({
			displayName: 'Body',
			required: true,
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
		const recipients = context.propsValue.recipients as string[];
		const ccRecipients = context.propsValue.ccRecipients as string[];
		const bccRecipients = context.propsValue.bccRecipients as string[];
		const attachments = context.propsValue.attachments as Array<{ file: ApFile; fileName: string }>;

		const { subject, body, bodyFormat } = context.propsValue;

		const mailPayload: Message = {
			subject,
			body: {
				content: body,
				contentType: bodyFormat as BodyType,
			},
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

		const client = Client.initWithMiddleware({
			authProvider: {
				getAccessToken: () => Promise.resolve(context.auth.access_token),
			},
		});

		const response = await client.api('/me/messages').post(mailPayload);

		return response;
	},
});
