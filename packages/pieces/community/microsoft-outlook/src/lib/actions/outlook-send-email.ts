import { ApFile, createAction, Property } from '@activepieces/pieces-framework';
import { BodyType, Message } from '@microsoft/microsoft-graph-types';
import { microsoftOutlookAuth } from '../common/auth';
import { outlookAtomicCommon } from '../common/atomic-common';
import { outlookCommon } from '../common/client';
import { outlookSendEmailActionOutputSchema } from '../output-schemas';

export const outlookSendEmailAction = createAction({
	auth: microsoftOutlookAuth,
	name: 'outlook_send_email',
	classification: 'WRITE',
	displayName: 'Send Email',
	description: 'Composes and sends a new email.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Composes and immediately sends a brand new email from the connected Outlook mailbox, with optional CC, BCC and attachments, and saves a copy in Sent Items. Use Reply to Message or Forward Message instead when responding to existing mail, and Create Draft when the message should be staged rather than sent. Not idempotent: every call dispatches another email.',
		idempotent: false,
	},
	props: {
		recipients: Property.Array({
			displayName: 'To Email(s)',
			description: 'Email addresses of the primary recipients.',
			required: true,
		}),
		ccRecipients: Property.Array({
			displayName: 'CC Email(s)',
			required: false,
		}),
		bccRecipients: Property.Array({
			displayName: 'BCC Email(s)',
			required: false,
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
			description: 'Files to attach. Total message size must stay under 3 MB.',
			required: false,
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
	outputSchema: outlookSendEmailActionOutputSchema,
	async run(context) {
		const recipients = context.propsValue.recipients as string[];
		const ccRecipients = (context.propsValue.ccRecipients ?? []) as string[];
		const bccRecipients = (context.propsValue.bccRecipients ?? []) as string[];
		const attachments = (context.propsValue.attachments ?? []) as Array<{
			file: ApFile;
			fileName: string;
		}>;

		const { subject, body, bodyFormat } = context.propsValue;

		const mailPayload: Message = {
			subject,
			body: {
				content: body,
				contentType: bodyFormat as BodyType,
			},
			toRecipients: recipients.map((mail) => ({ emailAddress: { address: mail } })),
			ccRecipients: ccRecipients.map((mail) => ({ emailAddress: { address: mail } })),
			bccRecipients: bccRecipients.map((mail) => ({ emailAddress: { address: mail } })),
			attachments: attachments.map((attachment) => ({
				'@odata.type': '#microsoft.graph.fileAttachment',
				name: attachment.fileName || attachment.file.filename,
				contentBytes: attachment.file.base64,
			})),
		};

		const client = outlookCommon.createClient(context.auth);

		try {
			await client.api(`${outlookCommon.mailboxPrefix(context.auth)}/sendMail`).post({
				message: mailPayload,
				saveToSentItems: 'true',
			});

			return {
				success: true,
				message: 'Email sent successfully.',
				subject,
				recipients,
			};
		} catch (error) {
			throw outlookAtomicCommon.graphError({ error, operation: 'Sending the Outlook email' });
		}
	},
});
