import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpRequest, HttpMethod, AuthenticationType, httpClient } from "@activepieces/pieces-common";
import { gmailAuth } from "../../";
import MailComposer from 'nodemailer/lib/mail-composer';
import mime from 'mime-types';
import Mail, { Attachment } from "nodemailer/lib/mailer";
import i18next from 'i18next';

export const gmailSendEmailAction = createAction({
	auth: gmailAuth,
	name: 'send_email',
	description: i18next.t('gmail:gmail.actions.send_email.description'),
	displayName: i18next.t('gmail:gmail.actions.send_email.displayName'),
	props: {
		receiver: Property.Array({
			displayName: i18next.t('gmail:gmail.actions.send_email.props.receiver.displayName'),
			description: undefined,
			required: true,
		}),
		cc: Property.Array({
			displayName: i18next.t('gmail:gmail.actions.send_email.props.cc.displayName'),
			description: undefined,
			required: false,
		}),
		bcc: Property.Array({
			displayName: i18next.t('gmail:gmail.actions.send_email.props.bcc.displayName'),
			description: undefined,
			required: false,
		}),
		subject: Property.ShortText({
			displayName: i18next.t('gmail:gmail.actions.send_email.props.subject.displayName'),
			description: undefined,
			required: true,
		}),
		body_text: Property.ShortText({
			displayName: 'Body (Text)',
			description: i18next.t('gmail:gmail.actions.send_email.props.body_text.displayName'),
			required: true,
		}),
		reply_to: Property.Array({
			displayName: 'Reply-To Email',
			description: i18next.t('gmail:gmail.actions.send_email.props.reply_to.displayName'),
			required: false,
		}),
		body_html: Property.ShortText({
			displayName: i18next.t('gmail:gmail.actions.send_email.props.body_html.displayName'),
			description: i18next.t('gmail:gmail.actions.send_email.props.body_html.description'),
			required: false,
		}),
		sender_name: Property.ShortText({
			displayName: i18next.t('gmail:gmail.actions.send_email.props.sender_name.displayName'),
			required: false,
		}),
		attachment: Property.File({
			displayName: i18next.t('gmail:gmail.actions.send_email.props.attachment.displayName'),
			description: i18next.t('gmail:gmail.actions.send_email.props.attachment.description'),
			required: false,
		}),
	},
	async run(configValue) {
		const subjectBase64 = Buffer.from(configValue.propsValue['subject']).toString("base64");
		const attachment = configValue.propsValue['attachment'];
		const replyTo = configValue.propsValue['reply_to']?.filter((email) => email !== '');
		const reciever = configValue.propsValue['receiver']?.filter((email) => email !== '');
		const cc = configValue.propsValue['cc']?.filter((email) => email !== '');
		const bcc = configValue.propsValue['bcc']?.filter((email) => email !== '');
		const mailOptions: Mail.Options = {
			to: reciever.join(', '), // Join all email addresses with a comma
			cc: cc ? cc.join(', ') : undefined,
			bcc: bcc ? bcc.join(', ') : undefined,
			subject: `=?UTF-8?B?${subjectBase64}?=`,
			replyTo: replyTo ? replyTo.join(', ') : "",
			text: configValue.propsValue['body_text'].replace(/\n/g, '<br>'),
			html: configValue.propsValue['body_html'],
			attachments: [],
		};
		const gmailResponse = await getEmail(configValue.auth.access_token);
		if (gmailResponse?.body?.email && configValue.propsValue['sender_name']) {
			mailOptions.from = `${configValue.propsValue['sender_name']} <${gmailResponse.body.email}>`;
		}

		if (attachment) {
			const lookupResult = mime.lookup(attachment?.extension ? attachment?.extension : '');
			const attachmentOption: Attachment[] = [{
				filename: attachment?.filename,
				content: attachment?.base64,
				contentType: lookupResult ? lookupResult : undefined,
				encoding: 'base64',
			}];
			mailOptions.attachments = attachmentOption;
		}

		const mail = new MailComposer(mailOptions).compile();
		const mailBody = await mail.build();

		const requestBody: SendEmailRequestBody = {
			raw: Buffer.from(mailBody).toString("base64").replace(/\+/g, '-').replace(/\//g, '_'),
		};

		const request: HttpRequest<Record<string, unknown>> = {
			method: HttpMethod.POST,
			url: `https://gmail.googleapis.com/gmail/v1/users/me/messages/send`,
			body: requestBody,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: configValue.auth.access_token,
			},
			queryParams: {},
		};

		return await httpClient.sendRequest(request);
	},

});

function getEmail(idtoken: string | null) {
	// Older connections doesn't have idtoken
	if (!idtoken) {
		return;
	}
	// Get Email from 'email' scope of Google OAuth2
	const request: HttpRequest<Record<string, unknown>> = {
		method: HttpMethod.GET,
		url: `https://www.googleapis.com/oauth2/v3/userinfo`,
		authentication: {
			type: AuthenticationType.BEARER_TOKEN,
			token: idtoken,
		},
		queryParams: {},
	};
	return httpClient.sendRequest<{
		email: string;
	}>(request);
}
type SendEmailRequestBody = {
	/**
	 * This is a base64 encoding of the email
	 */
	raw: string;
};
