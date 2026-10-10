import { createAction, Property } from '@activepieces/pieces-framework';

import { mailjetSendEmailOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';

export const mailjetSendEmailAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_send_email',
	outputSchema: mailjetSendEmailOutputSchema,
	displayName: 'Send Email',
	description: 'Sends one email through the Mailjet Send API v3.1.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Sends one transactional email. The sender must be a validated sender (see List Senders). Provide Text Part, HTML Part or Template ID; with a template, Variables fill its placeholders. Sandbox Mode validates the message without delivering it. A success status means accepted only: an unvalidated sender or a wrong template ID shows up later as Status "blocked" in Get Message. Not idempotent: each call sends a new email.',
		idempotent: false,
	},
	props: {
		fromEmail: Property.ShortText({
			displayName: 'From Email',
			description: 'Sender address. Must be a validated sender or on a validated domain.',
			required: true,
		}),
		fromName: Property.ShortText({
			displayName: 'From Name',
			description: 'Sender display name.',
			required: false,
		}),
		to: Property.Json({
			displayName: 'To',
			description:
				'JSON array of recipients, e.g. [{"Email":"jane@example.com","Name":"Jane"}]. Name is optional.',
			required: true,
		}),
		cc: Property.Json({
			displayName: 'Cc',
			description: 'JSON array of Cc recipients, same shape as To.',
			required: false,
		}),
		bcc: Property.Json({
			displayName: 'Bcc',
			description: 'JSON array of Bcc recipients, same shape as To.',
			required: false,
		}),
		replyTo: Property.ShortText({
			displayName: 'Reply-To Email',
			description: 'Address replies go to.',
			required: false,
		}),
		subject: Property.ShortText({
			displayName: 'Subject',
			description: 'Subject line. Optional when the template sets one.',
			required: false,
		}),
		textPart: Property.LongText({
			displayName: 'Text Part',
			description: 'Plain-text body.',
			required: false,
		}),
		htmlPart: Property.LongText({
			displayName: 'HTML Part',
			description: 'HTML body.',
			required: false,
		}),
		templateId: Property.Number({
			displayName: 'Template ID',
			description:
				'Numeric v3 template ID: the ExternalID field from Get Template or List Templates, not their ID field. Template language processing is turned on with it.',
			required: false,
		}),
		variables: Property.Object({
			displayName: 'Variables',
			description: 'Template variables as name/value pairs, used by {{var:name}} placeholders.',
			required: false,
		}),
		attachments: Property.Json({
			displayName: 'Attachments',
			description:
				'JSON array of files, e.g. [{"ContentType":"text/plain","Filename":"a.txt","Base64Content":"SGVsbG8="}].',
			required: false,
		}),
		customId: Property.ShortText({
			displayName: 'Custom ID',
			description: 'Your own ID for the message, returned in events and message lookups.',
			required: false,
		}),
		customCampaign: Property.ShortText({
			displayName: 'Custom Campaign',
			description: 'Campaign name to group this message under.',
			required: false,
		}),
		headers: Property.Object({
			displayName: 'Headers',
			description: 'Extra email headers as name/value pairs.',
			required: false,
		}),
		sandboxMode: mailjetAiProps.yesNo({
			displayName: 'Sandbox Mode',
			description: 'Yes validates the request and returns the result without sending the email.',
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.post({
			auth: context.auth,
			path: '/v3.1/send',
			body: {
				SandboxMode: p.sandboxMode,
				Messages: [
					{
						From: { Email: p.fromEmail, Name: p.fromName },
						To: p.to,
						Cc: p.cc,
						Bcc: p.bcc,
						ReplyTo: p.replyTo ? { Email: p.replyTo } : undefined,
						Subject: p.subject,
						TextPart: p.textPart,
						HTMLPart: p.htmlPart,
						TemplateID: p.templateId,
						TemplateLanguage: p.templateId !== undefined ? true : undefined,
						Variables: p.variables,
						Attachments: p.attachments,
						CustomID: p.customId,
						CustomCampaign: p.customCampaign,
						Headers: p.headers,
					},
				],
			},
		});
	},
});
