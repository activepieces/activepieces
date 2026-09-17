import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property, isNil } from '@activepieces/pieces-framework';
import { sendinblueAuth } from '../auth';
import { brevoCommon } from '../common';
import { brevoProps } from '../common/props';
import { sendTransactionalEmailActionOutputSchema } from '../output-schemas';

export const sendTransactionalEmail = createAction({
	auth: sendinblueAuth,
	name: 'send_transactional_email',
	outputSchema: sendTransactionalEmailActionOutputSchema,
	classification: 'WRITE',
	displayName: 'Send Transactional Email',
	description: 'Send an email from your Brevo account with HTML or plain text content.',
	audience: 'both',
	aiMetadata: {
		description:
			'Sends a one-off transactional email through Brevo, either by supplying subject and HTML content directly or by selecting a saved template and passing its variables. Use for receipts, password resets, notifications and other per-recipient mail; not for bulk marketing campaigns. Requires a verified sender unless a template with its own sender is used. Not idempotent — each call sends a new message.',
		idempotent: false,
	},
	props: {
		to: Property.Array({
			displayName: 'To',
			description: 'Recipients of the email.',
			required: true,
			properties: {
				email: Property.ShortText({ displayName: 'Email', required: true }),
				name: Property.ShortText({ displayName: 'Name', required: false }),
			},
		}),
		sender_email: brevoProps.senderEmail,
		sender_name: Property.ShortText({
			displayName: 'Sender Name',
			description: 'Overrides the display name of the selected sender.',
			required: false,
		}),
		template_id: brevoProps.emailTemplateId,
		subject: Property.ShortText({
			displayName: 'Subject',
			description: 'Required unless a template is selected.',
			required: false,
		}),
		html_content: Property.LongText({
			displayName: 'HTML Content',
			description: 'Required unless a template is selected.',
			required: false,
		}),
		text_content: Property.LongText({
			displayName: 'Text Content',
			description: 'Plain text alternative shown when HTML cannot be rendered.',
			required: false,
		}),
		params: Property.Object({
			displayName: 'Template Parameters',
			description: 'Values substituted into the template placeholders.',
			required: false,
		}),
		cc: Property.Array({
			displayName: 'CC',
			required: false,
			properties: {
				email: Property.ShortText({ displayName: 'Email', required: true }),
				name: Property.ShortText({ displayName: 'Name', required: false }),
			},
		}),
		bcc: Property.Array({
			displayName: 'BCC',
			required: false,
			properties: {
				email: Property.ShortText({ displayName: 'Email', required: true }),
				name: Property.ShortText({ displayName: 'Name', required: false }),
			},
		}),
		reply_to_email: Property.ShortText({
			displayName: 'Reply To',
			required: false,
		}),
		attachments: Property.Array({
			displayName: 'Attachments',
			description: 'Files attached by public URL. Brevo downloads each URL when sending.',
			required: false,
			properties: {
				url: Property.ShortText({ displayName: 'URL', required: true }),
				name: Property.ShortText({ displayName: 'File Name', required: true }),
			},
		}),
		tags: Property.Array({
			displayName: 'Tags',
			description: 'Labels used to filter this message in Brevo reporting.',
			required: false,
		}),
		scheduled_at: Property.DateTime({
			displayName: 'Scheduled At',
			description: 'Send the email at this UTC time instead of immediately.',
			required: false,
		}),
		sandbox: Property.Checkbox({
			displayName: 'Sandbox Mode',
			description:
				'Validate the request without delivering anything. Brevo checks the payload, sender and credentials, returns a message id, and drops the message: nothing reaches the recipient and no event is logged.',
			required: false,
		}),
	},
	async run(context) {
		const {
			to,
			sender_email,
			sender_name,
			template_id,
			subject,
			html_content,
			text_content,
			params,
			cc,
			bcc,
			reply_to_email,
			attachments,
			tags,
			scheduled_at,
			sandbox,
		} = context.propsValue;

		const recipients = toRecipients(to);
		if (recipients.length === 0) {
			throw new Error('At least one valid recipient email is required in "To".');
		}

		if (isNil(template_id) && (isNil(subject) || isNil(html_content))) {
			throw new Error(
				'Provide a Template, or supply both Subject and HTML Content.',
			);
		}

		if (isNil(template_id) && isNil(sender_email)) {
			throw new Error('A Sender is required when no Template is selected.');
		}

		const body = {
			to: recipients,
			sender: isNil(sender_email)
				? undefined
				: { email: sender_email, name: sender_name ?? undefined },
			templateId: template_id ?? undefined,
			subject: subject ?? undefined,
			htmlContent: html_content ?? undefined,
			textContent: text_content ?? undefined,
			params: brevoCommon.isEmptyObject(params) ? undefined : params,
			cc: emptyToUndefined(toRecipients(cc)),
			bcc: emptyToUndefined(toRecipients(bcc)),
			replyTo: isNil(reply_to_email) ? undefined : { email: reply_to_email },
			attachment: emptyToUndefined(toAttachments(attachments)),
			tags: emptyToUndefined(toStrings(tags)),
			scheduledAt: scheduled_at ?? undefined,
			headers: sandbox ? { 'X-Sib-Sandbox': 'drop' } : undefined,
		};

		return await brevoCommon.apiCall({
			apiKey: context.auth.secret_text,
			method: HttpMethod.POST,
			resourceUri: '/smtp/email',
			body,
		});
	},
});

function toRecipients(value: unknown): BrevoRecipient[] {
	if (!Array.isArray(value)) {
		return [];
	}

	return value.flatMap((entry) => {
		if (!isRecord(entry)) {
			return [];
		}
		const email = entry['email'];
		if (typeof email !== 'string' || email.length === 0) {
			return [];
		}
		const name = entry['name'];
		return [typeof name === 'string' && name.length > 0 ? { email, name } : { email }];
	});
}

function toAttachments(value: unknown): BrevoAttachment[] {
	if (!Array.isArray(value)) {
		return [];
	}

	return value.flatMap((entry) => {
		if (!isRecord(entry)) {
			return [];
		}
		const url = entry['url'];
		const name = entry['name'];
		if (typeof url !== 'string' || typeof name !== 'string') {
			return [];
		}
		return [{ url, name }];
	});
}

function toStrings(value: unknown): string[] {
	if (!Array.isArray(value)) {
		return [];
	}
	return value.filter((entry): entry is string => typeof entry === 'string');
}

function emptyToUndefined<T>(value: T[]): T[] | undefined {
	return value.length > 0 ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}


export type BrevoRecipient = {
	email: string;
	name?: string;
};

export type BrevoAttachment = {
	url: string;
	name: string;
};
