import { ApFile, createAction, Property } from '@activepieces/pieces-framework';
import { BodyType, Message } from '@microsoft/microsoft-graph-types';

import { microsoftOutlookAuth } from '../common/auth';
import { outlookCommon } from '../common/client';

export const sendEmailAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'send-email',
	classification: 'WRITE',
	displayName: 'Send Email',
	description: 'Send an email from your Outlook mailbox.',
	audience: 'both',
	aiMetadata: { description: 'Composes and sends a new email from the authenticated Outlook mailbox to the given recipients, with optional CC/BCC and file attachments. Use this to send a fresh message (not a reply or forward). Not idempotent: each call dispatches a new email and saves a copy to Sent Items.', idempotent: false },
	propertyGroups: [
		{
			key: 'recipients',
			display: 'tabs',
			label: 'Recipients',
			props: ['recipients', 'ccRecipients', 'bccRecipients'],
		},
	],
	props: {
		recipients: Property.Array({
			displayName: 'To',
			required: true,
		}),
		ccRecipients: Property.Array({
			displayName: 'Cc',
			required: false,
			defaultValue: [],
		}),
		bccRecipients: Property.Array({
			displayName: 'Bcc',
			required: false,
			defaultValue: [],
		}),
		subject: Property.ShortText({
			displayName: 'Subject',
			placeholder: 'Invoice for March',
			required: true,
		}),
		bodyFormat: Property.StaticDropdown({
			displayName: 'Body Format',
			description: 'How the text in Body is interpreted.',
			required: true,
			defaultValue: 'text',
			display: 'cards',
			options: {
				disabled: false,
				options: [
					{ label: 'Plain Text', value: 'text', description: 'Sent as written', icon: 'text' },
					{ label: 'HTML', value: 'html', description: 'Tags are rendered', icon: 'code' },
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
					displayName: 'Attachment Name',
					description: 'Overrides the uploaded file name.',
					placeholder: 'report.pdf',
					required: false,
				}),
			},
		}),
	},
	async run(context) {
		const attachments = (context.propsValue.attachments ?? []) as Array<{ file: ApFile; fileName: string }>;

		const { subject, body, bodyFormat } = context.propsValue;

		const mailPayload: Message = {
			subject,
			body: {
				content: body,
				contentType: bodyFormat as BodyType,
			},
			toRecipients: outlookCommon.toRecipients(context.propsValue.recipients),
			ccRecipients: outlookCommon.toRecipients(context.propsValue.ccRecipients),
			bccRecipients: outlookCommon.toRecipients(context.propsValue.bccRecipients),
			attachments: attachments.map((attachment) => ({
				'@odata.type': '#microsoft.graph.fileAttachment',
				name: attachment.fileName || attachment.file.filename,
				contentBytes: attachment.file.base64,
			})),
		};

		const client = outlookCommon.createClient(context.auth);

		const response = await client.api(`${outlookCommon.mailboxPrefix(context.auth)}/sendMail`).post({
			message: mailPayload,
			saveToSentItems: 'true',
		});

		return response;
	},
});
