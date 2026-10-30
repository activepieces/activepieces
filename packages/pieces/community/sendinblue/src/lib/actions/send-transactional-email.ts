import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, MarkdownVariant, Property, isNil } from '@activepieces/pieces-framework';
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
	description: 'Send one email, written here or from a saved Brevo template.',
	audience: 'both',
	aiMetadata: {
		description:
			'Sends a one-off transactional email through Brevo, either by supplying subject and HTML content directly or by selecting a saved template and passing its variables. Use for receipts, password resets, notifications and other per-recipient mail; not for bulk marketing campaigns. Requires a verified sender unless a template with its own sender is used. Not idempotent — each call sends a new message.',
		idempotent: false,
	},
	propertyGroups: [
		{
			key: 'recipients',
			display: 'tabs',
			label: 'Recipients',
			description: 'Who receives this email, and where replies go.',
			props: ['to', 'cc', 'bcc', 'reply_to_email'],
		},
	],
	props: {
		to: Property.Array({
			displayName: 'To',
			required: true,
			properties: {
				email: Property.ShortText({ displayName: 'Email', required: true }),
				name: Property.ShortText({ displayName: 'Name', required: false }),
			},
		}),
		cc: Property.Array({
			displayName: 'Cc',
			required: false,
			properties: {
				email: Property.ShortText({ displayName: 'Email', required: true }),
				name: Property.ShortText({ displayName: 'Name', required: false }),
			},
		}),
		bcc: Property.Array({
			displayName: 'Bcc',
			required: false,
			properties: {
				email: Property.ShortText({ displayName: 'Email', required: true }),
				name: Property.ShortText({ displayName: 'Name', required: false }),
			},
		}),
		reply_to_email: Property.ShortText({
			displayName: 'Reply To',
			description: 'Where replies go. Empty: back to the sender.',
			placeholder: 'support@example.com',
			required: false,
		}),
		sender_email: brevoProps.senderEmail,
		sender_name: Property.ShortText({
			displayName: 'Sender Name',
			description: 'Replaces the display name of the selected sender.',
			required: false,
		}),
		template_note: Property.MarkDown({
			value: 'Pick a template, or leave it empty and write the email below. Without a template, a sender is also required.',
			variant: MarkdownVariant.INFO,
		}),
		template_id: brevoProps.emailTemplateId,
		params: Property.Object({
			displayName: 'Template Parameters',
			description: 'Values for the template placeholders, by name.',
			required: false,
		}),
		subject: Property.ShortText({
			displayName: 'Subject',
			description: 'Required when no template is picked.',
			placeholder: 'Your order has shipped',
			required: false,
		}),
		html_content: Property.LongText({
			displayName: 'HTML Content',
			description: 'Required when no template is picked.',
			required: false,
		}),
		text_content: Property.LongText({
			displayName: 'Text Content',
			description: 'Plain text version for inboxes that cannot show HTML.',
			required: false,
		}),
		attachments: Property.Array({
			displayName: 'Attachments',
			description: 'Files by public URL that Brevo downloads when sending.',
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
			displayName: 'Send At',
			description: 'Leave empty to send right away.',
			required: false,
			advanced: true,
		}),
		sandbox: Property.Checkbox({
			displayName: 'Sandbox Mode',
			description: 'Brevo checks the request but delivers nothing.',
			required: false,
			advanced: true,
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
