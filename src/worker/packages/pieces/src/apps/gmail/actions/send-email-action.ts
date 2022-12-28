import {createAction} from '../../../framework/action/action';
import type {HttpRequest} from '../../../common/http/core/http-request';
import {HttpMethod} from '../../../common/http/core/http-method';
import {AuthenticationType} from '../../../common/authentication/core/authentication-type';
import {httpClient} from '../../../common/http/core/http-client';
import {PropertyType} from "../../../framework/property/prop.model";
export const gmailSendEmailAction = createAction({
	name: 'send_email',
	description: 'Send an email through a Gmail account',
    displayName:'Send Email',
	props: [
		{
			name: 'authentication',
			description: "",
			displayName: 'Authentication',
			type: PropertyType.OAUTH2,
			authUrl: "https://accounts.google.com/o/oauth2/auth",
			tokenUrl: "https://oauth2.googleapis.com/token",
			required: true,
			scope: ["https://mail.google.com/"]
		},
		{
			name: 'sender',
			displayName: 'Sender Email (From)',
			description: undefined,
			type: PropertyType.SHORT_TEXT,
			required: true,
		},
		{
			name: 'receiver',
			displayName: 'receiver Email (To)',
			description: undefined,
			type: PropertyType.SHORT_TEXT,
			required: true,
		},
		{
			name: 'subject',
			displayName: 'Subject',
			description: undefined,
			type:  PropertyType.SHORT_TEXT,
			required: true,
		},
		{
			name: 'bodyText',
			displayName: 'Body (Text)',
			description: 'Text version of the body for the email you want to send',
			type:  PropertyType.LONG_TEXT,
			required: true,
		},
		{
			name: 'bodyHml',
			displayName: 'Body (HTML)',
			description: 'HTML version of the body for the email you want to send',
			type:  PropertyType.LONG_TEXT,
			required: false,
		},
	],
	async run(configValue) {
		const mailOptions = {
			from: configValue.propsValue['sender'],
			to: configValue.propsValue['receiver'],
			subject: configValue.propsValue['subject'],
			text: configValue.propsValue['bodyText'],
			html: configValue.propsValue['bodyHtml'],
		};
		const emailText = `From: ${mailOptions.from}
To: ${mailOptions.to}
Subject: ${mailOptions.subject}
Content-Type: text/html
Content-Transfer-Encoding: base64

${mailOptions.html ? mailOptions.html : mailOptions.text}`;

		const requestBody: SendEmailRequestBody = {
			raw: Buffer.from(emailText).toString('base64'),
			payload: {
				headers: [
					{
						name: 'from',
						value: mailOptions.from,
					},
					{
						name: 'to',
						value: mailOptions.to,
					},
					{
						name: 'subject',
						value: mailOptions.subject,
					},
				],
				mimeType: 'text/html',
			},
		};
		const request: HttpRequest<Record<string, unknown>> = {
			method: HttpMethod.POST,
			url: `https://gmail.googleapis.com/gmail/v1/users/${mailOptions.from}/messages/send`,
			body: requestBody,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: configValue.propsValue['authentication']['access_token'],
			},
			queryParams: {},
		};
		return await httpClient.sendRequest(request);
	},
});

type SendEmailRequestBody = {
	/**
	 * This is a base64 encoding of the email
	 */
	raw: string;
	payload: {headers: Array<{name: string; value: string}>;
		mimeType: string;};
};