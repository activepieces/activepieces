import {createAction} from '../../../framework/action/action';
import {InputDataType} from '../../../framework/config/input-data-type.model';
import {InputRequestLocation} from '../../../framework/config/input-request-location.model';
import {InputUiType} from '../../../framework/config/input-ui-type.model';
import type {HttpRequest} from '../../../common/http/core/http-request';
import {HttpMethod} from '../../../common/http/core/http-method';
import {AuthenticationType} from '../../../common/authentication/core/authentication-type';
import {httpClient} from '../../../common/http/core/http-client';
export const gmailSendEmailAction = createAction({
	name: 'Send Email',
	description: 'Send an email through a Gmail account',
	url: 'https://gmail.googleapis.com/gmail/v1/users/{userId}/messages/send',
	httpMethod: HttpMethod.POST,
	configs: [
		{
			name: 'sender',
			displayName: 'Sender Email (From)',
			description: undefined,
			uiType: InputUiType.SHORT_TEXT,
			type: InputDataType.STRING,
			in: InputRequestLocation.BODY,
			required: true,
		},
		{
			name: 'reciever',
			displayName: 'Reciever Email (To)',
			description: undefined,
			uiType: InputUiType.SHORT_TEXT,
			type: InputDataType.STRING,
			in: InputRequestLocation.BODY,
			required: true,
		},
		{
			name: 'subject',
			displayName: 'Subject',
			description: undefined,
			uiType: InputUiType.SHORT_TEXT,
			type: InputDataType.STRING,
			in: InputRequestLocation.BODY,
			required: true,
		},
		{
			name: 'bodyText',
			displayName: 'Body (Text)',
			description: 'Text version of the body for the email you want to send',
			uiType: InputUiType.LONG_TEXT,
			type: InputDataType.STRING,
			in: InputRequestLocation.BODY,
			required: true,
		},
		{
			name: 'bodyHml',
			displayName: 'Body (HTML)',
			description: 'HTML version of the body for the email you want to send',
			uiType: InputUiType.LONG_TEXT,
			type: InputDataType.STRING,
			in: InputRequestLocation.BODY,
			required: false,
		},
	],
	async runner(configValue) {
		const mailOptions = {
			from: configValue.inputs.sender,
			to: configValue.inputs.reciever,
			subject: configValue.inputs.subject,
			text: configValue.inputs.bodyText,
			html: configValue.inputs.bodyHtml,
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
				token: configValue.authentication.accessToken,
			},
			queryParams: {},
		};
		return httpClient.sendRequest(request);
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
