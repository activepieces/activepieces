import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpRequest, HttpMethod, AuthenticationType, httpClient } from "@activepieces/pieces-common";
import { gmailAuth } from "../../";
import MailComposer from 'nodemailer/lib/mail-composer';

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
      description: 'Attachment',
      required: false,
    }),
  },
  sampleData: {},
    async run(configValue) {
    const subjectBase64 = Buffer.from(configValue.propsValue['subject']).toString("base64");
    const plainTextBody = configValue.propsValue['body_text'].replace(/\n/g, '<br>');
    const bodyHtml = configValue.propsValue['body_html'];
    const attachment = configValue.propsValue['attachment'];
    const replyTo = configValue.propsValue['reply_to'];
    // const content = configValue.propsValue['body_html'] ?? plainTextBody;
    const mailOptions = {
		to: configValue.propsValue['receiver'].join(', '), // Join all email addresses with a comma
        subject: `=?UTF-8?B?${subjectBase64}?=`,
        replyTo : replyTo? replyTo.join(', ') : "",
        text: plainTextBody,
        html: bodyHtml,
        attachments: [{}]
    }

    const attachmentOption = [{
	    filename: attachment?.filename,
		content: attachment?.base64,
		contentType: "application/pdf",
		encoding: 'base64',
	}];

	mailOptions.attachments = attachmentOption;
    const mail = new MailComposer(mailOptions).compile();

    const mailBody = await mail.build();
    //   console.log(mailBody.);
    // const headers = [
    //   `subject: =?UTF-8?B?${subjectBase64}?=`,
    //   "to: " + configValue.propsValue['receiver'].join(', '), // Join all email addresses with a comma
    //   "mime-version: 1.0",
    //   "content-type: multipart/related; boundary=boundary_" + Date.now().toString(),
    // ];
    // if (configValue.propsValue['reply_to']) {
    //   headers.push("reply-to: " + configValue.propsValue['reply_to'].join(', '));
    // }
    // const plainTextBody = configValue.propsValue['body_text'].replace(/\n/g, '<br>');
    // let message = headers.join("\n") + "\n\n" + (configValue.propsValue['body_html'] ?? plainTextBody);

    // const attachment = configValue.propsValue['attachment'];
    // if (attachment) {
    //   const boundary = 'boundary_' + Date.now().toString();

    //   message += '\n\n--' + boundary + "\n\n";


    //     const attachmentBase64 = Buffer.from(attachment.base64);
    //     const attachmentContentType = 'application/octet-stream'; // Adjust the content type according to your attachment type

    //     message += [
    //       'Content-Type: ' + attachmentContentType,
    //       'Content-Transfer-Encoding: base64',
    //       'Content-Disposition: attachment; filename="' + attachment.filename + '"',
    //       '',
    //       attachmentBase64,
    //       '',
    //       '--' + boundary,
    //     ].join('\n');

    //   message += '--';
    // }

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
