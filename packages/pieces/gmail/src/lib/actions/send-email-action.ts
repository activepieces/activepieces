import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpRequest, HttpMethod, AuthenticationType, httpClient } from "@activepieces/pieces-common";
import { gmailAuth } from "../../";
import MailComposer from 'nodemailer/lib/mail-composer';
import mime from 'mime-types';

export const gmailSendEmailAction = createAction({
  auth: gmailAuth,
  name: 'send_email',
  description: 'Send an email through a Gmail account',
  displayName: 'Send Email',
  props: {
    receiver: Property.Array({
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
    reply_to: Property.Array({
      displayName: 'Reply-To Email',
      description: 'Email address to set as the "Reply-To" header',
      required: false,
    }),
    body_html: Property.ShortText({
      displayName: 'Body (HTML)',
      description: 'HTML version of the body for the email you want to send',
      required: false,
    }),
    attachment: Property.File({
      displayName: 'Attachment',
      description: 'File to attach to the email you want to send',
      required: false,
    }),
  },
  sampleData: {
      "status": 200,
      "headers": {
        "content-type": "application/json; charset=UTF-8",
        "vary": "Origin, X-Origin, Referer",
        "date": "Mon, 17 Jul 2023 08:34:57 GMT",
        "server": "ESF",
        "cache-control": "private",
        "x-xss-protection": "0",
        "x-frame-options": "SAMEORIGIN",
        "x-content-type-options": "nosniff",
        "alt-svc": "h3=\":443\"; ma=2592000,h3-29=\":443\"; ma=2592000",
        "connection": "close",
        "transfer-encoding": "chunked"
      },
      "body": {
        "id": "17862bf0653c7e4f",
        "threadId": "17862bf0653c7e4f",
        "labelIds": [
          "SENT"
        ]
      }
  },
  async run(configValue) {
    const subjectBase64 = Buffer.from(configValue.propsValue['subject']).toString("base64");
    const attachment = configValue.propsValue['attachment'];
    const replyTo = configValue.propsValue['reply_to'];

    const mailOptions = {
        to: configValue.propsValue['receiver'].join(', '), // Join all email addresses with a comma
        subject: `=?UTF-8?B?${subjectBase64}?=`,
        replyTo : replyTo? replyTo.join(', ') : "",
        text: configValue.propsValue['body_text'].replace(/\n/g, '<br>'),
        html: configValue.propsValue['body_html'],
        attachments: [{}]
    }

    const attachmentOption = [{
	    filename: attachment?.filename,
		content: attachment?.base64,
		contentType: mime.lookup(attachment?.extension ? attachment?.extension : ''),
		encoding: 'base64',
	}];

    mailOptions.attachments = attachmentOption;

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

type SendEmailRequestBody = {
  /**
   * This is a base64 encoding of the email
   */
  raw: string;
};
