import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpRequest, HttpMethod, AuthenticationType, httpClient } from "@activepieces/pieces-common";
import { GmailProps } from "../common/props";

export const gmailSendEmailAction = createAction({
	name: 'send_email',
	description: 'Send an email through a Gmail account',
	displayName: 'Send Email',
	props: {
		authentication: GmailProps.authentication,
		receiver: Property.ShortText({
			displayName: 'Receiver Email (To)',
			description: undefined,
			required: true,
		}),
		subject: Property.ShortText({
			displayName: 'Subject',
			description: undefined,
			required: true,
		}),
		body_text: Property.ShortText({
			displayName: 'Body (Text)',
			description: 'Text version of the body for the email you want to send',
			required: true,
		}),
		body_html: Property.ShortText({
			displayName: 'Body (HTML)',
			description: 'HTML version of the body for the email you want to send',
			required: false,
		})
	},
	sampleData: {},
	async run(configValue) {
		const headers = [
			"subject: " + configValue.propsValue['subject'],
			"to: " + configValue.propsValue['receiver'],
			"mime-version: 1.0",
			"content-type: text/html"
		];
		const message = headers.join("\n") + "\n\n" + (configValue.propsValue['body_html'] ?? configValue.propsValue['body_text'])
		const requestBody: SendEmailRequestBody = {
			raw: Buffer.from(message).toString("base64").replace(/\+/g, '-').replace(/\//g, '_'),
		};
		const request: HttpRequest<Record<string, unknown>> = {
			method: HttpMethod.POST,
			url: `https://gmail.googleapis.com/gmail/v1/users/me/messages/send`,
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
};
